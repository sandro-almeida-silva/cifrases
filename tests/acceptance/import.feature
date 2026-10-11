Feature: Importação de cifra colada

  Scenario: músico importa uma cifra colada e salva na biblioteca
    Given a biblioteca está aberta
    When o músico cola o texto de uma cifra
    And confere a prévia e informa o título
    And salva na biblioteca
    Then a música deve abrir no player com os acordes

  Scenario: músico descarta a cifra colada
    Given o músico colou o texto de uma cifra
    When descarta a importação
    Then nenhuma música é adicionada à biblioteca
