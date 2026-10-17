# Guia: descarregar o jogador e as animações da Mixamo

Tempo: cerca de 20 minutos. Precisas de uma conta Adobe grátis.

## 1. Preparar a pasta
Cria esta pasta (fora do projeto, de propósito):
`C:\Users\jssantos\Documents\CLAUDE CODE\Bussola-mixamo`

## 2. Entrar
1. Abre https://www.mixamo.com
2. Clica em "Log in" e entra (ou cria) a conta Adobe grátis.

## 3. Escolher o jogador
1. Separador **Characters**.
2. Escolhe um rapaz/homem com **t-shirt e calções ou roupa desportiva** (assim o equipamento pinta-se melhor). Se não houver, escolhe um com t-shirt e calças.
3. Clica nele para o selecionar.
4. Clica em **Download** com estas opções:
   - Format: **FBX Binary (.fbx)**
   - Pose: **T-pose**
5. Guarda como `personagem.fbx` na pasta.

## 4. Descarregar as animações
Separador **Animations**. Para cada linha da tabela: escreve o termo na pesquisa, clica na animação, **marca "In Place" quando existir**, e clica **Download** com:
- Format: **FBX Binary (.fbx)**
- Skin: **Without Skin**
- Frames per Second: **30**
- Keyframe Reduction: **none**

| Guardar como | Procurar | Notas |
|---|---|---|
| `parado.fbx` | Breathing Idle | |
| `correr.fbx` | Running | marcar In Place |
| `sprint.fbx` | Fast Run | marcar In Place |
| `passe.fbx` | Soccer Pass | |
| `remate.fbx` | Soccer Kick (ou Strike Forward) | |
| `cabeca.fbx` | Header Soccerball | |
| `gr-parado.fbx` | Goalkeeper Idle | |
| `gr-defesa.fbx` | Goalkeeper Diving Save | |
| `festejo.fbx` | Victory (ou Cheering) | |
| `desanimo.fbx` | Disappointed | |
| `aplauso.fbx` | Clapping | |

Se algum nome não existir, escolhe o mais parecido e diz-me qual foi.

## 5. Avisar
Quando os 12 ficheiros estiverem na pasta, diz-me "ficheiros prontos". Eu converto, junto num só ficheiro leve e mostro-te o resultado antes de publicar.

Nota: não partilhes estes ficheiros soltos. A licença da Mixamo deixa usá-los dentro do jogo, mas não distribuí-los à parte. Por isso ficam fora do projeto.
