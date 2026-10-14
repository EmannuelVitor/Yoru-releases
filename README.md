# Yoru: downloads

Chamadas, tela, chat e grupos **P2P cifrados, sem servidor**.

**[Baixar a versão mais nova](https://github.com/EmannuelVitor/Yoru-releases/releases/latest)** · Site: [yoru-call.web.app](https://yoru-call.web.app)

| Sistema | Arquivo |
|---|---|
| Windows 10 e 11 | `Yoru-Setup-<versão>.exe` |
| macOS (Apple Silicon: M1 em diante) | `Yoru-<versão>-arm64.dmg` |
| macOS (Intel) | `Yoru-<versão>-x64.dmg` |
| Linux | `Yoru-<versão>.AppImage` (dê permissão de execução e abra) |
| Android | `Yoru-<versão>.apk` |

Depois de instalado, o Yoru avisa sozinho quando houver versão nova.

**Primeira vez no macOS:** o app não tem a assinatura paga da Apple. Clique com o botão direito no Yoru, em **Abrir**, e
confirme. Isso só é necessário na primeira vez.

**Primeira vez no Windows:** se aparecer "O Windows protegeu o computador", clique em **Mais informações** e depois em
**Executar assim mesmo**.

## Para quem mantém

Este repositório só guarda o que é publicado: as releases (instaladores) e `latest/` (índice de cada canal, que os apps
consultam). O código fica em outro repositório, privado.

- `latest/stable.json` e `latest/beta.json`: versão atual de cada canal. Não edite à mão: o lançamento sobrescreve. Os apps
  não confiam no índice sozinho: cada instalador de desktop é conferido pelo manifesto assinado e pelo SHA-256, e o APK pela
  assinatura do Android.
- `.github/workflows/lancamento.yml`: gera e publica as 5 edições. Lançar: **Actions → Lançamento → Run workflow**, com a
  versão (igual à do `package.json`) e o branch do código. O passo a passo dos segredos está em
  `docs/lancamento-automatico.md`, no repositório do código.
