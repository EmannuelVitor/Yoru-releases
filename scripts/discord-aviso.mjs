// Avisa no Discord de uma release do Yoru-releases (chamado pelo .github/workflows/discord.yml).
// Lê a release (TAG ou a mais nova, beta inclusive), monta os embeds no estilo do servidor e manda pelos webhooks.
// Teste local sem enviar: SIMULAR=1 node scripts/discord-aviso.mjs
const repo = process.env.GITHUB_REPOSITORY ?? 'Yoru-team/Yoru-releases'
const COR = 0x8b5cf6
const COR_BETA = 0x3ba55c
const SITE = 'https://yoru-call.web.app'
const SITE_BETA = 'https://yoru-call-beta.web.app'

async function gh(path) {
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'yoru-discord' }
  if (process.env.GH_TOKEN) headers.authorization = `Bearer ${process.env.GH_TOKEN}`
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, { headers })
  if (!res.ok) throw new Error(`GitHub ${res.status} em ${path}`)
  return res.json()
}

async function release() {
  const typed = process.env.TAG?.trim()
  if (typed) {
    // aceita "1.1.2" e "v1.1.2" (as tags são "v1.1.2"); se não existir, diz quais existem
    const tag = /^\d/.test(typed) ? `v${typed}` : typed
    try {
      return await gh(`/releases/tags/${encodeURIComponent(tag)}`)
    } catch (error) {
      if (!String(error.message).startsWith('GitHub 404')) throw error
      const known = (await gh('/releases?per_page=10')).filter((r) => !r.draft).map((r) => r.tag_name)
      throw new Error(`Não existe a versão "${typed}". Use uma destas: ${known.join(', ') || '(nenhuma publicada)'}.`)
    }
  }
  const list = await gh('/releases?per_page=10')
  const published = list.filter((r) => !r.draft).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
  if (!published.length) throw new Error('Nenhuma release publicada.')
  return published[0]
}

/** Instaladores por plataforma, na ordem em que aparecem. */
function downloads(assets) {
  const kinds = [
    ['🪟 Windows', (n) => /^Yoru-Setup-.*\.exe$/.test(n)],
    ['🍎 macOS (Apple Silicon)', (n) => /-arm64\.dmg$/.test(n)],
    ['🍏 macOS (Intel)', (n) => /-x64\.dmg$/.test(n)],
    ['🐧 Linux (AppImage)', (n) => /\.AppImage$/.test(n)],
    ['🤖 Android (APK)', (n) => /\.apk$/.test(n)]
  ]
  const lines = []
  for (const [label, match] of kinds) {
    const a = assets.find((x) => match(x.name))
    if (a) lines.push(`${label}: [${a.name}](${a.browser_download_url}) · ${(a.size / 1048576).toFixed(0)} MB`)
  }
  return lines
}

/** Corpo da release (gerado do changelog): "## Título" + itens "- **x**: y". */
function notas(body) {
  const text = (body ?? '').trim()
  const title = /^##\s+(.+)$/m.exec(text)?.[1]?.trim()
  const items = text.replace(/^##\s+.+$/m, '').trim()
  return { title, items: items.length > 3800 ? `${items.slice(0, 3800)}…` : items }
}

async function post(name, url, payload) {
  if (!url) {
    console.log(`Sem ${name}: aviso pulado.`)
    return
  }
  if (process.env.SIMULAR) {
    console.log(`----- ${name}\n${JSON.stringify(payload, null, 2)}`)
    return
  }
  const res = await fetch(`${url}?wait=true`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error(`Discord ${res.status} em ${name}: ${await res.text()}`)
  console.log(`Enviado em ${name}.`)
}

const r = await release()
const version = r.tag_name.replace(/^v/, '')
const beta = r.prerelease || /-beta\./.test(version)
const { title, items } = notas(r.body)
const links = downloads(r.assets)
const ping = (role) => (role ? `<@&${role}> ` : '')
const allowed = (role) => ({ parse: [], roles: role ? [role] : [] })
const base = { username: 'Yoru', avatar_url: undefined }

const downloadEmbed = {
  color: beta ? COR_BETA : COR,
  title: beta ? `🧪 Yoru ${version} · beta` : `🚀 Yoru ${version}`,
  url: r.html_url,
  description: [
    title ? `**${title}**\n` : '',
    links.length ? links.join('\n') : `Os instaladores estão na [página da versão](${r.html_url}).`,
    `🌐 Navegador: ${beta ? SITE_BETA : SITE}`,
    '',
    beta
      ? 'Versão de teste: pode ter bugs. Conte o que achou em #feedback-beta.'
      : 'Quem já tem o Yoru recebe a atualização sozinho. Os instaladores são para quem está chegando agora.',
    '⚠️ Baixe só por aqui ou pelo site oficial.'
  ].join('\n'),
  timestamp: r.published_at
}
const notesEmbed = {
  color: beta ? COR_BETA : COR,
  title: `🛠️ Novidades da ${version}${title ? ` · ${title}` : ''}`,
  url: r.html_url,
  description: items || 'Correções e melhorias.',
  timestamp: r.published_at
}

if (beta) {
  const role = process.env.DISCORD_CARGO_BETA
  await post('#builds', process.env.DISCORD_WEBHOOK_BUILDS, {
    ...base,
    content: `${ping(role)}Nova versão de teste no ar! 🧪`,
    allowed_mentions: allowed(role),
    embeds: [downloadEmbed, notesEmbed]
  })
} else {
  const role = process.env.DISCORD_CARGO_NOTIFICACOES
  await post('#releases', process.env.DISCORD_WEBHOOK_RELEASES, {
    ...base,
    content: `${ping(role)}O **Yoru ${version}** saiu! 🌙`,
    allowed_mentions: allowed(role),
    embeds: [downloadEmbed]
  })
  await post('#patch-notes', process.env.DISCORD_WEBHOOK_PATCH_NOTES, { ...base, allowed_mentions: allowed(null), embeds: [notesEmbed] })
}
