Feature: Biblioteca, música e player acessíveis

  Scenario: ações da biblioteca têm nome próprio por música
    Given a biblioteca tem duas músicas
    Then cada ação de favoritar, editar, excluir e tocar identifica a música
    And favoritar informa o estado marcado ou desmarcado

  Scenario: excluir uma música pede confirmação acessível
    Given o músico abriu a biblioteca
    When ele escolhe excluir uma música
    Then um diálogo pede confirmação com foco inicial em Cancelar
    And Esc fecha o diálogo sem excluir e devolve o foco ao botão
    When ele confirma a exclusão
    Then a música some da biblioteca

  Scenario: o player agrupa os ajustes e mostra o tom atual
    Given o músico abriu uma música no player
    Then os ajustes aparecem agrupados em Tom, Texto e Exibição
    When ele sobe meio-tom
    Then o tom atual mostra a tonalidade e o deslocamento

  Scenario: ocultar os ajustes libera espaço para a letra
    Given o músico abriu uma música no player
    When ele oculta os ajustes de leitura
    Then os controles somem e o botão informa que estão ocultos

  Scenario: controles têm área de toque adequada no celular
    Given o músico usa um celular
    Then botões e ícones da biblioteca e do player têm pelo menos 44px
