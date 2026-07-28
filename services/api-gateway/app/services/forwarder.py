"""Forward request tới downstream service qua httpx"""

import httpx
from fastapi import HTTPException, Request, Response

_SKIP = {
    "host",
    "content-length",
    "connection",
    "keep-alive",
    "transfer-encoding",
    "upgrade",
}


async def forward(
    client: httpx.AsyncClient,
    base_url: str,
    request: Request,
    extra_headers: dict[str, str] | None = None,
) -> Response:
    headers = {k: v for k, v in request.headers.items() if k.lower() not in _SKIP}
    if extra_headers:
        headers.update(extra_headers)
    try:
        upstream = await client.request(
            request.method,
            f"{base_url}{request.url.path}",
            headers=headers,
            content=await request.body(),
            params=request.query_params,
        )
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Upstream không kết nối được")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream timeout")
    resp_headers = {k: v for k, v in upstream.headers.items() if k.lower() not in _SKIP}
    return Response(
        content=upstream.content, status_code=upstream.status_code, headers=resp_headers
    )
