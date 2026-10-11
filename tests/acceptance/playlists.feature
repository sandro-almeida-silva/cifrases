Feature: Repertórios

  Scenario: músico monta um repertório e toca em ordem
    Given a biblioteca tem duas músicas
    When o músico cria um repertório e adiciona as músicas
    And reordena e abre o repertório no player
    Then as músicas são tocadas na ordem do repertório

  Scenario: repertório vazio
    Given o músico criou um repertório sem músicas
    Then o repertório mostra um estado vazio e não pode ser tocado
