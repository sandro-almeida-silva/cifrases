Feature: Blocos nomeados em repertórios

  Scenario: músico organiza um repertório em blocos e toca na ordem dos blocos
    Given o músico criou um repertório com três músicas
    When ele adiciona os blocos "Louvor" e "Ceia"
    And vincula cada música a um bloco
    Then o repertório é exibido agrupado por bloco
    And o player segue a ordem dos blocos

  Scenario: reordenar blocos reordena as músicas
    Given um repertório com dois blocos que têm músicas
    When o músico sobe o segundo bloco
    Then as músicas do segundo bloco passam a ser tocadas primeiro

  Scenario: renomear e remover um bloco
    Given um repertório com um bloco que tem uma música
    When o músico renomeia o bloco
    Then o novo nome é exibido
    When o músico exclui o bloco
    Then a música continua no repertório, sem bloco

  Scenario: os blocos persistem após recarregar
    Given um repertório com músicas vinculadas a blocos
    When o músico recarrega a página
    Then os blocos e vínculos continuam iguais
