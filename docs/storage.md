# Armazenamento de músicas e mídias

## Princípio

A música continua sendo a fonte de verdade do catálogo. O registro da música guarda apenas referências para mídia, nunca os binários completos.

## Modelo de mídia

Cada anexo de mídia deve ser tratado como uma referência com:

- `id`: identificador único do arquivo
- `kind`: `audio`, `cover` ou `original`
- `path`: URL pública, URL assinada ou identificador de storage
- `mimeType`: tipo do arquivo
- `size`: tamanho em bytes

Para compatibilidade com dados já existentes, o modelo também aceita os campos legados:

- `audioUrl`
- `coverUrl`
- `originalImageUrl`

## Convenção de caminho

Quando o conteúdo for armazenado fora do registro da música, o caminho recomendado é:

`cifrases:media:v1/{songId}/{kind}/{mediaId}`

Esse formato facilita substituição, remoção e limpeza de órfãos.

## Estratégia operacional

- O registro da música referencia a mídia.
- Substituir mídia significa trocar a referência no registro.
- Excluir mídia significa remover a referência e agendar limpeza do arquivo antigo.
- Falhas de upload não devem persistir um registro incompleto.
- A leitura da mídia deve aceitar tanto URL direta quanto identificador de storage.

## Variáveis de ambiente

No estágio atual, a aplicação não depende de uma integração externa de storage para funcionar.

Caso o projeto avance para bucket externo ou CDN privada, reservar estas variáveis:

- `NEXT_PUBLIC_MEDIA_BASE_URL`
- `NEXT_PUBLIC_AUDIO_BUCKET`
- `NEXT_PUBLIC_COVER_BUCKET`
- `NEXT_PUBLIC_ORIGINAL_BUCKET`

## Observação

A estrutura acima mantém o projeto pronto para evoluir para storage externo sem romper o formato atual de dados.
