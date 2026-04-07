from django.core.paginator import Paginator
from rest_framework.response import Response


class CursorPagination:
    """
    Cursor-based pagination for DRF ViewSets.
    Uses offset/limit semantics with a `cursor` param.
    """

    page_size = 50

    def paginate_queryset(self, queryset, request, view=None):
        page_size = int(
            request.query_params.get("page_size", self.page_size)
        )
        cursor = request.query_params.get("cursor")
        limit = min(int(request.query_params.get("limit", page_size)), 100)

        if cursor:
            try:
                offset = int(cursor)
            except ValueError:
                offset = 0
        else:
            offset = 0

        paginator = Paginator(queryset, limit)
        page_number = (offset // limit) + 1

        try:
            page = paginator.page(page_number)
        except Exception:
            page = paginator.page(paginator.num_pages)

        return page.object_list

    def get_paginated_response(self, data, count=None, has_more=False, next_cursor=None):
        return Response(
            {
                "success": True,
                "data": data,
                "meta": {
                    "pagination": {
                        "count": count,
                        "has_more": has_more,
                        "next_cursor": next_cursor,
                    }
                },
            }
        )
