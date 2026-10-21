Feature: Editor de música acessível

  Scenario: seções e linhas têm nome e agrupamento próprios
    Given o músico abriu uma música para editar
    Then cada linha é um grupo nomeado com sua seção
    And as ações de mover e remover identificam a seção e a linha

  Scenario: salvar com erro leva o foco ao primeiro campo inválido
    Given o músico abriu o cadastro de uma música vazia
    When ele tenta salvar
    Then um alerta informa quantos campos precisam de correção
    And o foco vai para o primeiro campo inválido, marcado como inválido

  Scenario: adicionar e mover mantêm o foco e são anunciados
    Given o músico está editando uma música
    When ele adiciona uma seção
    Then o foco vai para o nome da nova seção e a ação é anunciada
    When ele adiciona uma linha
    Then o foco vai para a letra da nova linha
    When ele sobe a segunda seção
    Then a ação é anunciada e o foco permanece em um controle da seção

  Scenario: remover uma linha devolve o foco a um controle estável
    Given uma seção com duas linhas
    When o músico remove uma linha
    Then o foco vai para o botão de adicionar linha da seção

  Scenario: controles têm área de toque adequada no celular
    Given o músico usa um celular
    Then os controles do editor têm pelo menos 44px
