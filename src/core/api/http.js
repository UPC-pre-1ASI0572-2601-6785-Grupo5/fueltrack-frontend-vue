const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function request(path, options = {}) {
    const token = localStorage.getItem('token')
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const err = new Error(body.message || res.statusText)
        err.status = res.status
        throw err
    }
    if (res.status === 204) return null
    return res.json()
}

export const http = {
    get:    (path, opts)       => request(path, { ...opts, method: 'GET' }),
    post:   (path, body, opts) => request(path, { ...opts, method: 'POST',  body: JSON.stringify(body) }),
    put:    (path, body, opts) => request(path, { ...opts, method: 'PUT',   body: JSON.stringify(body) }),
    patch:  (path, body, opts) => request(path, { ...opts, method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path, opts)       => request(path, { ...opts, method: 'DELETE' }),
}
