import { checkRateLimit } from "@/app/utils"

export async function POST(request: Request) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return Response.json({ error: 'ファイルがありません' }, { status: 400 })
  }

  const token = process.env.CMS_INTEGRATION_TOKEN
  if (!token) {
    return Response.json({ error: 'Token is missing' }, { status: 500 })
  }

  const cmsUrl = `${process.env.CMS_BASE_URL}/api/${process.env.CMS_WORKSPACE_ID}/projects/${process.env.CMS_PROJECT_ID}/assets`

  const body = new FormData()
  body.append('file', file)

  const response = await fetch(cmsUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    return Response.json({ error: text }, { status: response.status })
  }

  const data = await response.json()
  return Response.json({ success: true, data }, { status: 201 })
}
