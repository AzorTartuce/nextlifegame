/**
 * Mundo real. A simulação trabalha em "unidades internas" (o mesmo balanceamento em qualquer lugar);
 * cada país converte isso para a moeda local com `k` (moeda local por unidade interna),
 * calibrado para que um primeiro emprego pague algo parecido com o salário real do lugar.
 * `ppp` (moeda local por dólar internacional) permite comparar poder de compra entre países.
 */
export interface CityDef {
  name: string;
  /** Custo de moradia/estilo de vida relativo ao resto do país. */
  cost: number;
  /** Salários relativos ao resto do país. */
  wage: number;
  /** Tamanho do mercado consumidor (clientes potenciais). */
  size: number;
}

export interface CountryDef {
  id: string;
  name: string;
  flag: string;
  currency: { symbol: string; code: string };
  /** Moeda local por unidade interna. */
  k: number;
  ppp: number;
  /** Alíquotas do imposto de renda: faixa baixa e faixa alta. */
  tax: [number, number];
  /** Multiplicador de mortalidade (expectativa de vida). */
  life: number;
  cities: CityDef[];
  names: { m: string[]; f: string[]; last: string[] };
  foods: string[];
  places: string[];
}

type CityRow = [name: string, cost: number, wage: number, size: number];
const cities = (rows: CityRow[]): CityDef[] => rows.map(([name, cost, wage, size]) => ({ name, cost, wage, size }));

export const COUNTRIES: CountryDef[] = [
  {
    id: 'br', name: 'Brasil', flag: '🇧🇷', currency: { symbol: 'R$', code: 'BRL' }, k: 1.1, ppp: 2.5, tax: [0.15, 0.275], life: 1.05,
    cities: cities([
      ['São Paulo', 1.2, 1.2, 1.6], ['Rio de Janeiro', 1.1, 1.05, 1.3], ['Belo Horizonte', 0.95, 0.95, 1], ['Brasília', 1.05, 1.25, 0.9],
      ['Porto Alegre', 0.95, 1, 0.9], ['Curitiba', 1, 1.05, 0.9], ['Salvador', 0.85, 0.8, 0.9], ['Recife', 0.85, 0.8, 0.85],
      ['Fortaleza', 0.8, 0.78, 0.85], ['Florianópolis', 1.05, 1, 0.6],
    ]),
    names: {
      m: ['Miguel', 'Arthur', 'Heitor', 'Davi', 'Gabriel', 'Bernardo', 'Rafael', 'Lucas', 'Pedro', 'Matheus', 'Caio', 'Thiago'],
      f: ['Helena', 'Alice', 'Laura', 'Maria', 'Valentina', 'Cecília', 'Isabela', 'Sofia', 'Beatriz', 'Júlia', 'Larissa', 'Camila'],
      last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ribeiro', 'Almeida', 'Carvalho', 'Gomes', 'Rocha'],
    },
    foods: ['pastel', 'coxinha', 'pão de queijo', 'açaí', 'brigadeiro', 'feijoada'],
    places: ['na padaria', 'no ponto de ônibus', 'na fila do banco', 'no mercado', 'num show', 'na praia'],
  },
  {
    id: 'pt', name: 'Portugal', flag: '🇵🇹', currency: { symbol: '€', code: 'EUR' }, k: 0.62, ppp: 0.6, tax: [0.21, 0.37], life: 0.92,
    cities: cities([['Lisboa', 1.35, 1.2, 1.5], ['Porto', 1.1, 1.05, 1.2], ['Braga', 0.9, 0.9, 0.7], ['Coimbra', 0.9, 0.9, 0.6], ['Faro', 1, 0.9, 0.5], ['Funchal', 0.95, 0.85, 0.4]]),
    names: {
      m: ['João', 'Francisco', 'Tiago', 'Duarte', 'Rodrigo', 'Afonso', 'Diogo', 'Tomás', 'Martim', 'Miguel', 'Rui', 'Nuno'],
      f: ['Maria', 'Leonor', 'Matilde', 'Beatriz', 'Carolina', 'Inês', 'Mariana', 'Ana', 'Sofia', 'Catarina', 'Joana', 'Rita'],
      last: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gonçalves', 'Almeida'],
    },
    foods: ['pastel de nata', 'bifana', 'francesinha', 'bacalhau', 'caldo verde', 'tosta mista'],
    places: ['na pastelaria', 'no elétrico', 'na fila das finanças', 'no mercado', 'num festival', 'na praia'],
  },
  {
    id: 'us', name: 'Estados Unidos', flag: '🇺🇸', currency: { symbol: 'US$', code: 'USD' }, k: 1.8, ppp: 1, tax: [0.12, 0.24], life: 1,
    cities: cities([
      ['Nova York', 1.5, 1.3, 1.8], ['Los Angeles', 1.35, 1.2, 1.5], ['Chicago', 1.05, 1.05, 1.2], ['Houston', 0.95, 1, 1.1],
      ['Miami', 1.2, 1, 1], ['São Francisco', 1.6, 1.5, 0.9], ['Austin', 1.05, 1.1, 0.8], ['Seattle', 1.25, 1.3, 0.8], ['Atlanta', 0.95, 0.98, 0.9],
    ]),
    names: {
      m: ['Liam', 'Noah', 'Oliver', 'James', 'Elijah', 'William', 'Henry', 'Lucas', 'Mason', 'Ethan', 'Jack', 'Tyler'],
      f: ['Olivia', 'Emma', 'Charlotte', 'Amelia', 'Sophia', 'Mia', 'Isabella', 'Ava', 'Harper', 'Emily', 'Madison', 'Chloe'],
      last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Wilson', 'Anderson', 'Taylor', 'Moore'],
    },
    foods: ['hot dog', 'bagel', 'cheeseburger', 'donut', 'burrito', 'mac and cheese'],
    places: ['no diner', 'no metrô', 'na fila do Starbucks', 'no supermercado', 'num jogo de beisebol', 'no drive-thru'],
  },
  {
    id: 'ca', name: 'Canadá', flag: '🇨🇦', currency: { symbol: 'C$', code: 'CAD' }, k: 2, ppp: 1.25, tax: [0.15, 0.29], life: 0.88,
    cities: cities([['Toronto', 1.3, 1.15, 1.6], ['Vancouver', 1.35, 1.1, 1.2], ['Montreal', 1, 1, 1.3], ['Calgary', 1.05, 1.15, 0.9], ['Ottawa', 1.05, 1.1, 0.8], ['Halifax', 0.9, 0.9, 0.4]]),
    names: {
      m: ['Liam', 'Noah', 'Ethan', 'Jacob', 'Logan', 'Lucas', 'Benjamin', 'Nathan', 'Olivier', 'Samuel', 'Felix', 'Owen'],
      f: ['Olivia', 'Emma', 'Charlotte', 'Ava', 'Chloe', 'Zoe', 'Léa', 'Sophie', 'Emily', 'Abigail', 'Ella', 'Hannah'],
      last: ['Smith', 'Tremblay', 'Roy', 'Wilson', 'MacDonald', 'Gagnon', 'Brown', 'Singh', 'Chen', 'Campbell', 'Lee', 'Martin'],
    },
    foods: ['poutine', 'tarte de xarope de bordo', 'bagel de Montreal', 'bacon canadense', 'donut do Tim Hortons', 'butter tart'],
    places: ['no Tim Hortons', 'no ônibus', 'na fila do banco', 'no mercado', 'num jogo de hóquei', 'à beira do lago'],
  },
  {
    id: 'mx', name: 'México', flag: '🇲🇽', currency: { symbol: 'MX$', code: 'MXN' }, k: 4.7, ppp: 10, tax: [0.16, 0.3], life: 1.05,
    cities: cities([['Cidade do México', 1.15, 1.2, 1.7], ['Guadalajara', 1, 1.05, 1.1], ['Monterrey', 1.05, 1.2, 1.1], ['Cancún', 1.05, 0.95, 0.7], ['Puebla', 0.85, 0.85, 0.8], ['Mérida', 0.85, 0.85, 0.6]]),
    names: {
      m: ['Santiago', 'Mateo', 'Sebastián', 'Emiliano', 'Diego', 'Leonardo', 'Alejandro', 'Daniel', 'Carlos', 'Luis', 'Jorge', 'Iván'],
      f: ['Sofía', 'Valentina', 'Regina', 'Camila', 'Ximena', 'María', 'Fernanda', 'Daniela', 'Renata', 'Guadalupe', 'Paola', 'Mariana'],
      last: ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez'],
    },
    foods: ['taco', 'tamal', 'elote', 'chilaquiles', 'churro', 'pozole'],
    places: ['na taquería', 'no metrô', 'na fila do banco', 'no mercado', 'num show de mariachi', 'no zócalo'],
  },
  {
    id: 'ar', name: 'Argentina', flag: '🇦🇷', currency: { symbol: 'AR$', code: 'ARS' }, k: 300, ppp: 400, tax: [0.15, 0.3], life: 1,
    cities: cities([['Buenos Aires', 1.15, 1.15, 1.8], ['Córdoba', 0.95, 0.95, 1], ['Rosário', 0.95, 0.95, 0.9], ['Mendoza', 0.95, 0.95, 0.7], ['Bariloche', 1, 0.9, 0.3], ['Salta', 0.85, 0.85, 0.5]]),
    names: {
      m: ['Mateo', 'Santiago', 'Benjamín', 'Thiago', 'Lautaro', 'Juan', 'Facundo', 'Nicolás', 'Tomás', 'Franco', 'Agustín', 'Matías'],
      f: ['Emilia', 'Martina', 'Sofía', 'Catalina', 'Lucía', 'Julieta', 'Camila', 'Valentina', 'Agustina', 'Florencia', 'Milagros', 'Carolina'],
      last: ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'Romero', 'Sosa', 'Acosta', 'Benítez'],
    },
    foods: ['empanada', 'alfajor', 'asado', 'medialuna', 'choripán', 'dulce de leche'],
    places: ['no café da esquina', 'no subte', 'na fila do banco', 'na feira', 'num clássico de futebol', 'na milonga'],
  },
  {
    id: 'uk', name: 'Reino Unido', flag: '🇬🇧', currency: { symbol: '£', code: 'GBP' }, k: 1.25, ppp: 0.7, tax: [0.2, 0.4], life: 0.9,
    cities: cities([['Londres', 1.5, 1.3, 1.9], ['Manchester', 1, 1, 1.1], ['Birmingham', 0.95, 0.95, 1], ['Edimburgo', 1.05, 1.05, 0.8], ['Glasgow', 0.9, 0.95, 0.8], ['Bristol', 1.1, 1.05, 0.7], ['Cardiff', 0.9, 0.9, 0.5]]),
    names: {
      m: ['Oliver', 'George', 'Arthur', 'Noah', 'Harry', 'Oscar', 'Jack', 'Charlie', 'Freddie', 'Alfie', 'Callum', 'Rhys'],
      f: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Lily', 'Florence', 'Poppy', 'Grace', 'Ivy', 'Evie', 'Megan', 'Eilidh'],
      last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Davies', 'Evans', 'Thomas', 'Johnson', 'Roberts', 'Walker'],
    },
    foods: ['fish and chips', 'scone', 'crumpet', 'Sunday roast', 'meat pie', 'sanduíche de bacon'],
    places: ['no pub', 'no metrô', 'na fila do correio', 'no mercado', 'num jogo de futebol', 'na chuva (claro)'],
  },
  {
    id: 'fr', name: 'França', flag: '🇫🇷', currency: { symbol: '€', code: 'EUR' }, k: 1.2, ppp: 0.72, tax: [0.2, 0.41], life: 0.88,
    cities: cities([['Paris', 1.45, 1.25, 1.8], ['Marselha', 0.95, 0.95, 1], ['Lyon', 1.1, 1.05, 1.1], ['Toulouse', 1, 1, 0.9], ['Nice', 1.15, 1, 0.7], ['Bordeaux', 1.05, 1, 0.8], ['Lille', 0.95, 0.95, 0.8]]),
    names: {
      m: ['Gabriel', 'Léo', 'Raphaël', 'Louis', 'Arthur', 'Hugo', 'Jules', 'Lucas', 'Adam', 'Maël', 'Nathan', 'Théo'],
      f: ['Emma', 'Jade', 'Louise', 'Alice', 'Chloé', 'Lina', 'Léa', 'Manon', 'Camille', 'Inès', 'Juliette', 'Éva'],
      last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent'],
    },
    foods: ['croissant', 'baguete', 'crêpe', 'macaron', 'quiche', 'croque-monsieur'],
    places: ['na boulangerie', 'no metrô', 'na fila da prefeitura', 'no mercado', 'num bistrô', 'às margens do Sena'],
  },
  {
    id: 'de', name: 'Alemanha', flag: '🇩🇪', currency: { symbol: '€', code: 'EUR' }, k: 1.45, ppp: 0.75, tax: [0.24, 0.42], life: 0.9,
    cities: cities([['Berlim', 1.15, 1.05, 1.6], ['Munique', 1.4, 1.25, 1.2], ['Hamburgo', 1.15, 1.1, 1.1], ['Frankfurt', 1.2, 1.25, 1], ['Colônia', 1.05, 1.05, 0.9], ['Leipzig', 0.9, 0.9, 0.6], ['Stuttgart', 1.15, 1.2, 0.8]]),
    names: {
      m: ['Noah', 'Matteo', 'Elias', 'Leon', 'Paul', 'Felix', 'Jonas', 'Lukas', 'Finn', 'Maximilian', 'Tim', 'Jan'],
      f: ['Emilia', 'Sophia', 'Hannah', 'Mia', 'Lina', 'Lea', 'Emma', 'Marie', 'Clara', 'Johanna', 'Anna', 'Greta'],
      last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Richter'],
    },
    foods: ['pretzel', 'currywurst', 'schnitzel', 'strudel', 'Brötchen', 'Berliner'],
    places: ['na padaria', 'no U-Bahn', 'na fila da repartição', 'no mercado', 'na Oktoberfest', 'no biergarten'],
  },
  {
    id: 'es', name: 'Espanha', flag: '🇪🇸', currency: { symbol: '€', code: 'EUR' }, k: 0.9, ppp: 0.65, tax: [0.19, 0.37], life: 0.84,
    cities: cities([['Madri', 1.25, 1.2, 1.7], ['Barcelona', 1.25, 1.15, 1.6], ['Valência', 1, 0.95, 1], ['Sevilha', 0.9, 0.85, 0.9], ['Bilbao', 1, 1.05, 0.7], ['Málaga', 1, 0.85, 0.8]]),
    names: {
      m: ['Hugo', 'Martín', 'Lucas', 'Mateo', 'Leo', 'Daniel', 'Pablo', 'Álvaro', 'Adrián', 'Manuel', 'Javier', 'Sergio'],
      f: ['Lucía', 'Sofía', 'Martina', 'María', 'Paula', 'Julia', 'Carmen', 'Valeria', 'Alba', 'Noa', 'Claudia', 'Irene'],
      last: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Ruiz', 'Hernández', 'Jiménez'],
    },
    foods: ['tortilha', 'churros', 'paella', 'jamón', 'bocadillo', 'tapas'],
    places: ['no bar da esquina', 'no metrô', 'na fila do banco', 'no mercado', 'numa festa de rua', 'na praia'],
  },
  {
    id: 'it', name: 'Itália', flag: '🇮🇹', currency: { symbol: '€', code: 'EUR' }, k: 0.95, ppp: 0.67, tax: [0.23, 0.35], life: 0.86,
    cities: cities([['Roma', 1.2, 1.1, 1.6], ['Milão', 1.35, 1.25, 1.5], ['Nápoles', 0.85, 0.8, 1.1], ['Turim', 1, 1, 0.9], ['Florença', 1.1, 1, 0.7], ['Bolonha', 1.05, 1.05, 0.7], ['Palermo', 0.8, 0.75, 0.8]]),
    names: {
      m: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Riccardo', 'Tommaso', 'Edoardo', 'Matteo', 'Luca'],
      f: ['Sofia', 'Giulia', 'Aurora', 'Alice', 'Ginevra', 'Emma', 'Giorgia', 'Greta', 'Beatrice', 'Chiara', 'Martina', 'Francesca'],
      last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo'],
    },
    foods: ['pizza', 'gelato', 'cannoli', 'espresso e cornetto', 'lasanha', 'tiramisù'],
    places: ['no bar', 'no metrô', 'na fila do correio', 'na feira', 'numa festa de rua', 'na piazza'],
  },
  {
    id: 'jp', name: 'Japão', flag: '🇯🇵', currency: { symbol: '¥', code: 'JPY' }, k: 145, ppp: 100, tax: [0.1, 0.23], life: 0.78,
    cities: cities([['Tóquio', 1.35, 1.2, 2], ['Osaka', 1.05, 1, 1.3], ['Quioto', 1, 0.95, 0.6], ['Nagoia', 0.95, 1, 0.9], ['Sapporo', 0.9, 0.9, 0.7], ['Fukuoka', 0.9, 0.92, 0.8], ['Yokohama', 1.1, 1.05, 1]]),
    names: {
      m: ['Haruto', 'Sota', 'Ren', 'Yuto', 'Hinata', 'Kaito', 'Riku', 'Daiki', 'Takumi', 'Kenji', 'Hiroshi', 'Shota'],
      f: ['Yui', 'Hina', 'Sakura', 'Mio', 'Aoi', 'Rin', 'Yuna', 'Mei', 'Haruka', 'Akari', 'Emi', 'Nanami'],
      last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Hayashi'],
    },
    foods: ['onigiri', 'ramen', 'takoyaki', 'melonpan', 'sushi de balcão', 'mochi'],
    places: ['no konbini', 'no trem lotado', 'na fila do ramen', 'no mercado', 'num festival de verão', 'sob as cerejeiras'],
  },
  {
    id: 'kr', name: 'Coreia do Sul', flag: '🇰🇷', currency: { symbol: '₩', code: 'KRW' }, k: 1560, ppp: 850, tax: [0.15, 0.26], life: 0.85,
    cities: cities([['Seul', 1.3, 1.2, 2], ['Busan', 0.95, 0.95, 1], ['Incheon', 1, 1, 0.9], ['Daegu', 0.9, 0.92, 0.8], ['Daejeon', 0.9, 0.95, 0.6], ['Jeju', 0.95, 0.85, 0.3]]),
    names: {
      m: ['Minjun', 'Seojun', 'Doyun', 'Hajun', 'Jiho', 'Junseo', 'Hyunwoo', 'Jaehyun', 'Taeyang', 'Sungmin', 'Dongwoo', 'Jin'],
      f: ['Seoyeon', 'Jiwoo', 'Haeun', 'Soyul', 'Minseo', 'Yuna', 'Jiyoung', 'Hana', 'Eunji', 'Sooah', 'Nayeon', 'Dayeon'],
      last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Shin'],
    },
    foods: ['kimbap', 'tteokbokki', 'bibimbap', 'ramyeon', 'hotteok', 'kimchi jjigae'],
    places: ['no PC bang', 'no metrô de Seul', 'na fila do café', 'no mercado', 'num karaokê', 'no rio Han'],
  },
  {
    id: 'cn', name: 'China', flag: '🇨🇳', currency: { symbol: 'CN¥', code: 'CNY' }, k: 2.2, ppp: 4.2, tax: [0.1, 0.25], life: 0.95,
    cities: cities([['Xangai', 1.3, 1.3, 2], ['Pequim', 1.3, 1.3, 2], ['Shenzhen', 1.2, 1.3, 1.5], ['Guangzhou', 1.1, 1.15, 1.4], ['Chengdu', 0.9, 0.95, 1.2], ['Hangzhou', 1.1, 1.2, 1], ['Wuhan', 0.85, 0.9, 1]]),
    names: {
      m: ['Wei', 'Hao', 'Jun', 'Ming', 'Lei', 'Yang', 'Chen', 'Bo', 'Tao', 'Jian', 'Kai', 'Xin'],
      f: ['Mei', 'Li', 'Xiu', 'Yan', 'Jing', 'Fang', 'Ling', 'Hua', 'Na', 'Qing', 'Yu', 'Ting'],
      last: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou', 'Xu', 'Sun'],
    },
    foods: ['baozi', 'dumpling', 'noodles de lamen', 'pato laqueado', 'tangyuan', 'youtiao'],
    places: ['na barraquinha de rua', 'no metrô', 'na fila do WeChat Pay', 'no mercado', 'num karaokê', 'no parque ao amanhecer'],
  },
  {
    id: 'in', name: 'Índia', flag: '🇮🇳', currency: { symbol: '₹', code: 'INR' }, k: 10, ppp: 21, tax: [0.1, 0.2], life: 1.2,
    cities: cities([['Mumbai', 1.3, 1.25, 2], ['Nova Délhi', 1.15, 1.2, 2], ['Bangalore', 1.15, 1.3, 1.4], ['Hyderabad', 1, 1.1, 1.2], ['Chennai', 0.95, 1, 1.1], ['Calcutá', 0.9, 0.9, 1.2], ['Pune', 0.95, 1.05, 0.9]]),
    names: {
      m: ['Aarav', 'Vihaan', 'Arjun', 'Reyansh', 'Ishaan', 'Rohan', 'Aditya', 'Krishna', 'Rahul', 'Karan', 'Vikram', 'Sai'],
      f: ['Aanya', 'Diya', 'Saanvi', 'Ananya', 'Priya', 'Isha', 'Kavya', 'Meera', 'Riya', 'Neha', 'Pooja', 'Anjali'],
      last: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Iyer', 'Mehta', 'Joshi', 'Nair', 'Verma', 'Das'],
    },
    foods: ['samosa', 'dosa', 'chai com biscoito', 'paratha', 'pav bhaji', 'jalebi'],
    places: ['na barraca de chai', 'no trem lotado', 'na fila do banco', 'no bazar', 'num casamento (sempre tem um)', 'num jogo de críquete'],
  },
  {
    id: 'ng', name: 'Nigéria', flag: '🇳🇬', currency: { symbol: '₦', code: 'NGN' }, k: 60, ppp: 190, tax: [0.07, 0.19], life: 1.5,
    cities: cities([['Lagos', 1.2, 1.25, 2], ['Abuja', 1.15, 1.2, 1], ['Port Harcourt', 1, 1.1, 0.9], ['Kano', 0.8, 0.8, 1], ['Ibadan', 0.85, 0.85, 0.9], ['Enugu', 0.85, 0.85, 0.6]]),
    names: {
      m: ['Chinedu', 'Emeka', 'Tunde', 'Ayo', 'Ifeanyi', 'Obinna', 'Kelechi', 'Femi', 'Chidi', 'Segun', 'Yusuf', 'Ibrahim'],
      f: ['Chioma', 'Ngozi', 'Amara', 'Aisha', 'Funke', 'Adaeze', 'Zainab', 'Temitope', 'Folake', 'Ifunanya', 'Yetunde', 'Halima'],
      last: ['Okafor', 'Adeyemi', 'Okonkwo', 'Balogun', 'Eze', 'Abubakar', 'Ogunleye', 'Nwosu', 'Bello', 'Olawale', 'Ibrahim', 'Adeleke'],
    },
    foods: ['jollof rice', 'suya', 'puff-puff', 'akara', 'moi moi', 'plantain frito'],
    places: ['no mercado', 'no danfo (o ônibus amarelo)', 'na fila do banco', 'na festa de rua', 'num casamento animado', 'no trânsito de Lagos'],
  },
  {
    id: 'za', name: 'África do Sul', flag: '🇿🇦', currency: { symbol: 'R', code: 'ZAR' }, k: 3.8, ppp: 7.5, tax: [0.18, 0.31], life: 1.35,
    cities: cities([['Joanesburgo', 1.1, 1.2, 1.6], ['Cidade do Cabo', 1.15, 1.1, 1.3], ['Durban', 0.95, 0.95, 1], ['Pretória', 1, 1.1, 0.9], ['Port Elizabeth', 0.85, 0.85, 0.6]]),
    names: {
      m: ['Lethabo', 'Thabo', 'Sipho', 'Liam', 'Ethan', 'Bongani', 'Kagiso', 'Johan', 'Pieter', 'Nkosana', 'Jaco', 'Tumelo'],
      f: ['Lerato', 'Nomvula', 'Thandi', 'Amahle', 'Zinhle', 'Emma', 'Annelie', 'Palesa', 'Naledi', 'Chloe', 'Busisiwe', 'Karabo'],
      last: ['Nkosi', 'Dlamini', 'Naidoo', 'Van der Merwe', 'Botha', 'Khumalo', 'Mokoena', 'Pretorius', 'Smith', 'Zulu', 'Pillay', 'Molefe'],
    },
    foods: ['biltong', 'bunny chow', 'braai', 'vetkoek', 'boerewors roll', 'koeksister'],
    places: ['no braai', 'no minibus-táxi', 'na fila do banco', 'no mercado', 'num jogo de rúgbi', 'na Table Mountain'],
  },
  {
    id: 'au', name: 'Austrália', flag: '🇦🇺', currency: { symbol: 'A$', code: 'AUD' }, k: 2.2, ppp: 1.5, tax: [0.19, 0.32], life: 0.85,
    cities: cities([['Sydney', 1.35, 1.2, 1.6], ['Melbourne', 1.2, 1.1, 1.5], ['Brisbane', 1.1, 1.05, 1], ['Perth', 1.05, 1.1, 0.9], ['Adelaide', 0.95, 0.95, 0.7], ['Canberra', 1.1, 1.2, 0.5]]),
    names: {
      m: ['Oliver', 'Noah', 'Jack', 'William', 'Leo', 'Charlie', 'Thomas', 'Lachlan', 'Mitchell', 'Ryan', 'Jayden', 'Hudson'],
      f: ['Charlotte', 'Olivia', 'Mia', 'Amelia', 'Isla', 'Matilda', 'Ruby', 'Chloe', 'Grace', 'Willow', 'Evie', 'Sienna'],
      last: ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Anderson', 'Thompson', 'Martin', 'White', 'Walker', 'Nguyen'],
    },
    foods: ['meat pie', 'lamington', 'Vegemite toast', 'tim tam', 'barramundi grelhado', 'sausage roll'],
    places: ['no pub', 'no trem', 'na fila do café', 'no mercado', 'num jogo de footy', 'na praia'],
  },
  {
    id: 'ae', name: 'Emirados Árabes', flag: '🇦🇪', currency: { symbol: 'AED ', code: 'AED' }, k: 2.2, ppp: 2.2, tax: [0, 0], life: 0.95,
    cities: cities([['Dubai', 1.3, 1.2, 1.8], ['Abu Dhabi', 1.2, 1.2, 1.3], ['Sharjah', 0.9, 0.85, 0.8], ['Al Ain', 0.85, 0.85, 0.4]]),
    names: {
      m: ['Mohammed', 'Ahmed', 'Omar', 'Khalid', 'Ali', 'Yousef', 'Hamad', 'Saeed', 'Rashid', 'Zayed', 'Faisal', 'Majid'],
      f: ['Fatima', 'Maryam', 'Aisha', 'Mariam', 'Noor', 'Shamma', 'Latifa', 'Hessa', 'Sara', 'Moza', 'Reem', 'Amna'],
      last: ['Al Mansoori', 'Al Nahyan', 'Al Maktoum', 'Al Suwaidi', 'Al Shamsi', 'Al Ketbi', 'Al Falasi', 'Al Hashemi', 'Al Zaabi', 'Khan', 'Hussain', 'Rahman'],
    },
    foods: ['shawarma', 'luqaimat', 'manakish', 'falafel', 'machboos', 'karak chai'],
    places: ['no shopping', 'no metrô de Dubai', 'na fila do banco', 'no souk', 'no deserto', 'na marina'],
  },
];

export const countryById = (id: string): CountryDef => COUNTRIES.find((c) => c.id === id) ?? COUNTRIES[0];
export const cityOf = (c: CountryDef, name: string): CityDef => c.cities.find((x) => x.name === name) ?? c.cities[0];

/** Índice de poder de compra por unidade interna (para comparar países ao se mudar). */
export const purchasingIndex = (c: CountryDef) => c.k / c.ppp;
