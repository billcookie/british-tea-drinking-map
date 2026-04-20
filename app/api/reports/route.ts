import { checkRateLimit, convertFieldsToApiFormat } from "@/app/utils"

export async function POST(request: Request) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const { fields } = await request.json()

  if (!fields) {
    return Response.json({ error: 'fields が必要です' }, { status: 400 })
  }

  const token = process.env.CMS_INTEGRATION_TOKEN
  if (!token) {
    return Response.json({ error: 'Token is missing' }, { status: 500 })
  }

  const cmsUrl = `${process.env.CMS_BASE_URL}/api/${process.env.CMS_WORKSPACE_ID}/projects/${process.env.CMS_PROJECT_ID}/models/${process.env.CMS_MODEL_ID}/items`

  const response = await fetch(cmsUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: convertFieldsToApiFormat(fields) }),
  })

  if (!response.ok) {
    const text = await response.text()
    return Response.json({ error: text }, { status: response.status })
  }

  const data = await response.json()
  const publishUrl = `${process.env.CMS_BASE_URL}/api/${process.env.CMS_WORKSPACE_ID}/projects/${process.env.CMS_PROJECT_ID}/models/${process.env.CMS_MODEL_ID}/items/${data.id}/publish`
  await fetch(publishUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  return Response.json({ success: true, data }, { status: 201 })
}
