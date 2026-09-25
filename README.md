# Bússola do Avançado

Ferramenta tática interativa de bolso para um avançado (ala esquerda ou direita) do Vitória
de Setúbal Sub-10, futebol de 7, sistema 3-1-2.

Publicado em: https://jefferstosprojeto.github.io/Bussola/

## O que tem

- **Campo tático (SVG)** com a formação 3-1-2. Jogadores e adversários são arrastáveis
  (rato e toque). Um alternador define se jogas pela ala esquerda (AE) ou direita (AD).
- **Modo Ataque / Defesa**: desenha automaticamente a seta de decisão (caminho livre, 1x1
  ou 1x2 no ataque; pressão imediata na defesa).
- **Regras em campo**: 15 cartões com regras de decisão para um avançado, ligados às zonas
  do campo.
- **Treino de decisões**: quiz de 15 perguntas de escolha múltipla, com ordem embaralhada,
  feedback imediato, nota final de 0 a 10 e melhor pontuação guardada.

Posições no campo, lado ativo e melhor pontuação do quiz ficam guardados no `localStorage`
do browser, por isso persistem entre visitas no mesmo dispositivo.

## Estrutura

Página única, autocontida: `index.html` com CSS e JavaScript inline. Sem build, sem
dependências além das Google Fonts (Oswald e Work Sans), carregadas por `<link>`.

## Correr localmente

Como é um ficheiro único sem dependências, basta abrir `index.html` num browser. Para testar
com o comportamento mais próximo de produção (evita problemas de acentuação por falta de
charset no `file://`), corre um servidor local simples a partir da pasta do projeto:

```
python -m http.server 8000
```

e abre `http://localhost:8000/`.

## Editar

Todo o código (HTML, CSS, JS) está em `index.html`. Não há passo de build: qualquer edição
ao ficheiro reflete-se diretamente ao recarregar a página.

## Publicar

O GitHub Pages serve diretamente a branch `main` deste repositório. Um `git push` para
`main` atualiza https://jefferstosprojeto.github.io/Bussola/ automaticamente.
