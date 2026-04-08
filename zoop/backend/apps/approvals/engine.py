from dataclasses import dataclass

from .models import ApprovalFlow, ApprovalStep, ApprovalAction


@dataclass
class ApprovalResult:
    success: bool
    message: str = ""
    next_step_approver_id: str = None


class ApprovalEngine:
    """
    Selects and advances approval flows for an expense.

    assign_flow:  matches a flow to an expense based on amount + category
    advance:      records an approval/rejection and moves to next step or finalises
    """

    def __init__(self, company):
        self.company = company

    def assign_flow(self, expense) -> ApprovalFlow | None:
        """Select the first active flow that matches amount + category."""
        flows = ApprovalFlow.objects.filter(
            company=self.company,
            is_active=True,
            amount_min__lte=expense.amount,
        )

        for flow in flows:
            if flow.amount_max and expense.amount > flow.amount_max:
                continue
            if flow.categories and expense.category not in flow.categories:
                continue
            return flow

        return None

    def advance(
        self,
        expense,
        actor,
        action: str,
        comment: str = "",
    ) -> ApprovalResult:
        """
        Record actor's decision on the current step.

        If action == 'approved' and there is a next step, notify the next approver.
        If action == 'approved' and there is no next step, mark expense approved.
        If action == 'rejected', mark expense rejected.
        """
        current_step = expense.current_step
        if current_step == 0:
            # First approval — look up the first step
            flow = self.assign_flow(expense)
            if not flow:
                return ApprovalResult(
                    success=False,
                    message="No approval flow configured",
                )
            steps = list(flow.steps.all())
            if not steps:
                return ApprovalResult(success=False, message="No approval steps")
            step = steps[0]
            if step.approver_type == "auto":
                expense.status = "approved"
                expense.current_step = len(steps)
                expense.total_steps = len(steps)
                expense.save()
                return ApprovalResult(success=True, message="Auto-approved")
            step_to_record = step
        else:
            from apps.approvals.models import ApprovalStep
            try:
                step = ApprovalStep.objects.get(
                    flow__company=self.company,
                    order=current_step - 1,
                )
                step_to_record = step
            except ApprovalStep.DoesNotExist:
                return ApprovalResult(
                    success=False,
                    message="Current step not found",
                )

        # Record the action
        ApprovalAction.objects.create(
            expense=expense,
            step=step_to_record,
            actor=actor,
            action=action,
            comment=comment,
        )

        if action == "rejected":
            expense.status = "rejected"
            expense.rejection_reason = comment
            expense.save()
            return ApprovalResult(success=True, message="Expense rejected")

        if action == "approved":
            # Move to next step
            next_step_order = current_step + 1
            try:
                next_step = ApprovalStep.objects.get(
                    flow=step_to_record.flow, order=next_step_order
                )
                if next_step.approver_type == "auto":
                    expense.status = "approved"
                    expense.current_step = next_step_order + 1
                    expense.save()
                    return ApprovalResult(success=True, message="Auto-approved at final step")
                expense.current_step = next_step_order
                expense.status = "pending_approval"
                expense.save()
                return ApprovalResult(
                    success=True,
                    message=f"Moved to step {next_step_order}",
                    next_step_approver_id=str(next_step.approver_user_id) if next_step.approver_user else None,
                )
            except ApprovalStep.DoesNotExist:
                # Final approval
                expense.status = "approved"
                expense.current_step = next_step_order
                expense.save()
                return ApprovalResult(success=True, message="Expense fully approved")

        return ApprovalResult(success=False, message="Unknown action")

    def get_pending_queue(self, user) -> list:
        """
        Return expenses pending approval by this user.
        Handles role-based and user-specific approvers.
        """
        from apps.expenses.models import Expense

        qs = Expense.objects.filter(
            company=user.company,
            status__in=["submitted", "pending_approval"],
        )

        # Filter to only expenses where user is the current approver
        pending = []
        for expense in qs:
            current_step = expense.current_step
            if current_step == 0:
                flow = self.assign_flow(expense)
                if not flow:
                    continue
                step = flow.steps.filter(order=0).first()
            else:
                from apps.approvals.models import ApprovalStep
                try:
                    step = ApprovalStep.objects.get(
                        flow__company=user.company,
                        order=current_step - 1,
                    )
                except ApprovalStep.DoesNotExist:
                    continue

            if not step:
                continue

            if step.approver_type == "manager" and expense.user.manager == user:
                pending.append(expense)
            elif step.approver_type == "role" and step.approver_role == user.role:
                pending.append(expense)
            elif step.approver_type == "user" and step.approver_user == user:
                pending.append(expense)

        return pending
