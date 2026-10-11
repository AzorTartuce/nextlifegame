# QA no navegador

Capturas: `/private/tmp/claude-501/-Users-z-Desktop-nextlife/496718d7-4672-4f91-949e-fba2ed400f6f/scratchpad/shots/qa/` (prefixo `p-` = retrato 390x844, `l-` = paisagem 1280x720). Roteiro reexecutável: `scripts/smoke.mjs` (`npm run smoke`).

## Como rodar
```
npx vite --port 5199 &
PW=/caminho/playwright-core CHROME=/caminho/chrome node scripts/smoke.mjs [pastaDeCapturas] [url]
```
Sai com código 1 e lista problemas (erros/avisos de console, overflow horizontal, botões com texto cortado, vazamento PT/EN). Usa `window.__nl` (só DEV). Não faz parte do vitest.

## Coberto (retrato e paisagem)
Escolha de idioma, aviso de maioridade, nova vida (país/cidade/talento premium), tutorial (passo 1), turnos e eventos, tempo automático, as 6 abas, os 9 apps do celular (Bolsa, GlobalMart, Saúde, Cassino, Viagens, Lazer, Rua, Pets, Ajustes) em PT e EN, minigames Livro/Sinais/Assalto/Fuga, prisão (Vida e Rua), troca de idioma ao vivo com evento aberto, tela de morte (pontuação, fitas, momentos) e nova vida/herdeiro. Verificado visualmente nas capturas: sem overflow, sem sobreposição, sem erros de console.

## Bugs achados e corrigidos
- Textos sem tradução em EN: rótulos de atributos (Felicidade, Inteligência, Aparência, Carisma, Estresse), abas Empresa/Pessoas, app Ajustes/Bolsa, pontuação da morte (Longevidade, Riqueza, Conquistas, Felicidade), papéis (Mãe, Irmão, Marido...), grupos em Pessoas, sub-abas de Bolsa/GlobalMart/Cassino, Fuga da prisão, risco/humor/calma nos itens, "Fundar ... 🚀", "Falta: Diploma", "Carisma N", nível das lojas (Econômica/Luxo), dicas da Rotina, setor/nome de carreira nas vagas. Adicionados em `src/i18n/en/ui.ts` e `t()` nos pontos de uso.
- Texto guardado no idioma antigo: causa da morte, momentos marcantes, memórias de pessoas e evento aberto (título/texto/botões) agora passam por `retranslate`; `retranslate` também traduz parâmetros (inclusive valores em moeda local), corrigindo "Ambition achieved: Juntar C$20.000!".

## Pendente / limitações
- Eventos sorteados com parâmetros aleatórios, já abertos ou no histórico, continuam no idioma em que nasceram ao trocar PT↔EN (ex.: "At the supermarket checkout ..." em PT). Só mensagens fixas ou com parâmetros simples são retraduzidas.
- Memórias de pessoas ("A traição", "A vingança do controle sumido") vêm das storylets sem chave EN.
- Não exercitados no smoke: apps Especiais (política/música/atuação/esporte/espaço, só aparecem por idade/estado), Modo Deus, trade/carrinho em profundidade; foram vistos em rodadas anteriores (`shots/` do scratchpad).
- Com a tela "Sua rotina" em EN o cabeçalho "Where your routine is taking you" quebra em 2 linhas ao lado da energia (cosmético).
