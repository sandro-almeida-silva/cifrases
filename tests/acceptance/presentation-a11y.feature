Feature: Apresentação acessível

  Scenario: seções longas viram vários slides sem perder linhas
    Given uma música com uma seção de seis linhas e um refrão
    When o músico abre a apresentação
    Then a seção longa é dividida em duas partes equilibradas
    And o refrão aparece em outro slide

  Scenario: controles e slide têm nomes acessíveis
    Given o músico abriu a apresentação
    Then o slide é um grupo "Slide 1 de 3" com o nome da seção
    And os botões se chamam "Slide anterior" e "Próximo slide"
    And o botão do limite informa que está desabilitado sem perder o foco

  Scenario: navegação por teclado
    Given o músico abriu a apresentação
    When ele usa as setas, Home e End
    Then o slide muda e a mudança é anunciada

  Scenario: ir direto a um slide pela lista
    Given o músico abriu a apresentação
    When ele escolhe um slide na lista de slides
    Then o slide escolhido é exibido e marcado como atual

  Scenario: sem música selecionada
    Given nenhuma música foi aberta
    When o músico abre a apresentação
    Then uma orientação explica como começar e há um atalho para a biblioteca

  Scenario: controles têm área de toque adequada no celular
    Given o músico usa um celular
    Then os controles da apresentação têm pelo menos 44px e não há rolagem horizontal
