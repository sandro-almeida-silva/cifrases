Feature: Repertório em lote

  Scenario: músico cria um repertório a partir de uma lista de nomes
    Given a biblioteca tem algumas das músicas da lista
    When o músico cola a lista e cria o repertório
    Then as músicas existentes são vinculadas sem duplicar
    And as ausentes ficam em uma fila de importação

  Scenario: músico importa uma música da fila
    Given existe uma música pendente na fila
    When o músico cola a cifra, revisa e salva
    Then a música entra no repertório na posição da lista
