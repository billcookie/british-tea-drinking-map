export function convertFieldsToApiFormat(fields: Record<string, unknown>) {
  const apiFields = [];

  if (fields.name) {
    apiFields.push({ key: 'name', type: 'text', value: fields.name });
  }

  if (fields.category) {
    apiFields.push({ key: 'category', type: 'select', value: fields.category });
  }

  if (fields.description) {
    apiFields.push({ key: 'description', type: 'textArea', value: fields.description });
  }

  // 位置情報（GeoJSON文字列として渡す）
  if (fields.latitude !== undefined && fields.longitude !== undefined) {
    apiFields.push({
      key: 'location',
      type: 'geometryObject',
      value: JSON.stringify({
        type: 'Point',
        coordinates: [fields.longitude, fields.latitude] // [経度, 緯度]
      })
    });
  }

  if (fields.status) {
    apiFields.push({ key: 'status', type: 'select', value: fields.status });
  }

  if (fields.rating) {
    apiFields.push({ key: 'rating', type: 'number', value: fields.rating });
  }

  // アセットID
  if (fields.assetIds && Array.isArray(fields.assetIds) && fields.assetIds.length > 0) {
    apiFields.push({ key: 'photos', type: 'asset', value: fields.assetIds });
  }

  return apiFields;
}

// limit each IP to 5 requests per 10 minutes to prevent spam
const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_REQUESTS = 5

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

function getIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export function checkRateLimit(request: Request): Response | null {
  const ip = getIp(request)
  const now = Date.now()

  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return null
  }

  if (entry.count >= MAX_REQUESTS) {
    return Response.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  entry.count++
  return null
}
