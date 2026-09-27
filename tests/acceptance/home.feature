Feature: Cifrases home

  Scenario: músico abre a experiência inicial
    Given que o músico acessa o Cifrases
    Then ele vê a apresentação "Sua música, no tempo certo."
    And ele encontra a ação "Abrir player"
    And ele encontra a ação "Explorar biblioteca"

  Scenario: experiência inicial funciona em mobile
    Given que o músico acessa o Cifrases em um dispositivo móvel
    Then o conteúdo principal continua visível
    And as ações principais continuam acessíveis
