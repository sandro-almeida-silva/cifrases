# Modos de apresentação

## Modo Celebração 16:9

Experiência para TV, projetor ou outro dispositivo de apresentação.

Regras:

- reutiliza a mesma entidade `Song` do player;
- não mantém cópia paralela do conteúdo;
- prioriza legibilidade à distância;
- suporta tela cheia quando disponível;
- usa configuração de apresentação sem alterar a música persistida.

Relacionada às issues #22 e #23.

## Modo palco / teleprompter

Projeção de execução focada no músico em monitor de palco.

Regras:

- reutiliza `Song` e `SongTimeline`;
- remove navegação desnecessária;
- permite atalhos de teclado;
- acompanha a linha ativa e o auto-scroll quando houver timeline;
- funciona também sem timeline;
- não altera a música persistida;
- respeita acessibilidade e redução de movimento.

Atalhos da primeira versão:

| Tecla | Ação |
| --- | --- |
| Space | Pausar/retomar |
| ArrowDown / ArrowRight | Avançar |
| ArrowUp / ArrowLeft | Voltar |
| + / - | Aumentar/reduzir velocidade |
| 0 | Restaurar velocidade |
| F | Tela cheia |
| Esc | Sair do modo |

Relacionada à issue #37 e às capacidades das issues #9, #11, #12 e #28.
