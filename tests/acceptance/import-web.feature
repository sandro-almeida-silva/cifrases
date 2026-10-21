Feature: Importação de cifra pesquisada na internet

  Scenario: músico busca uma música, escolhe o resultado e acompanha o progresso
    Given a tela de importação está aberta
    When o músico busca por um termo
    Then os resultados encontrados são listados para escolha
    When o músico escolhe um resultado
    Then cada etapa da importação mostra seu status
    And o rascunho abre para revisão com título, artista, tom e prévia
    And nada é salvo na biblioteca até o músico confirmar

  Scenario: a busca não encontra resultados
    Given a tela de importação está aberta
    When o músico busca por um termo sem resultados
    Then a etapa de busca informa que nada foi encontrado

  Scenario: falha ao baixar a página escolhida
    Given o músico buscou e escolheu um resultado
    When o download da página falha
    Then a etapa de download aparece como falha com a mensagem do erro
    And o músico pode tentar novamente ou colar a cifra manualmente
