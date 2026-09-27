Feature: Biblioteca musical

  Scenario: músico encontra uma música e abre o player
    Given a biblioteca foi carregada
    When o músico abre uma música
    Then a cifra deve ser exibida no modo músico

  Scenario: músico cadastra uma música
    Given o editor está aberto
    When o músico informa o título e salva
    Then a música deve abrir no player
