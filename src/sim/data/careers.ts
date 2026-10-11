import type { CourseId, EduLevel } from '../types';

export interface CareerDef {
  id: string;
  name: string;
  icon: string;
  hours: number;
  stress: number;
  /** Não aceita quem tem condenações. */
  cleanRecord?: boolean;
  req: { edu?: EduLevel; degree?: CourseId; inteligencia?: number; saude?: number; aparencia?: number; carisma?: number; minAge?: number; license?: string };
  levels: { title: string; salary: number }[];
}

export const CAREERS: CareerDef[] = [
  {
    id: 'atendente', name: 'Varejo', icon: '🛎️', hours: 44, stress: 1.1, req: { minAge: 16 },
    levels: [
      { title: 'Atendente', salary: 1600 }, { title: 'Atendente Sênior', salary: 2000 },
      { title: 'Supervisor(a)', salary: 3200 }, { title: 'Gerente de Loja', salary: 5500 },
    ],
  },
  {
    id: 'entregador', name: 'Logística', icon: '🛵', hours: 40, stress: 1.0, req: { minAge: 18, saude: 40 },
    levels: [
      { title: 'Entregador(a)', salary: 1900 }, { title: 'Motorista', salary: 2600 },
      { title: 'Coordenador(a) de Frota', salary: 4500 },
    ],
  },
  {
    id: 'escritorio', name: 'Administrativo', icon: '🗂️', hours: 40, stress: 0.9, req: { edu: 'medio', minAge: 18 },
    levels: [
      { title: 'Assistente', salary: 2200 }, { title: 'Analista Jr', salary: 3500 },
      { title: 'Analista Pleno', salary: 5200 }, { title: 'Coordenador(a)', salary: 8000 },
    ],
  },
  {
    id: 'programador', name: 'Tecnologia', icon: '💻', hours: 40, stress: 1.2, req: { degree: 'tecnologia', inteligencia: 55 },
    levels: [
      { title: 'Dev Estagiário(a)', salary: 2500 }, { title: 'Dev Júnior', salary: 5000 },
      { title: 'Dev Pleno', salary: 9000 }, { title: 'Dev Sênior', salary: 15000 }, { title: 'CTO', salary: 28000 },
    ],
  },
  {
    id: 'enfermagem', cleanRecord: true, name: 'Enfermagem', icon: '🩺', hours: 44, stress: 1.4, req: { degree: 'saude' },
    levels: [
      { title: 'Técnico(a) de Enfermagem', salary: 3000 }, { title: 'Enfermeiro(a)', salary: 5200 },
      { title: 'Enfermeiro(a) Chefe', salary: 8500 },
    ],
  },
  {
    id: 'medicina', cleanRecord: true, name: 'Medicina', icon: '⚕️', hours: 50, stress: 1.6, req: { degree: 'saude', inteligencia: 75 },
    levels: [
      { title: 'Residente', salary: 6000 }, { title: 'Médico(a)', salary: 14000 },
      { title: 'Especialista', salary: 24000 }, { title: 'Chefe de Cirurgia', salary: 38000 },
    ],
  },
  {
    id: 'advocacia', cleanRecord: true, name: 'Direito', icon: '⚖️', hours: 45, stress: 1.4, req: { degree: 'direito', inteligencia: 60 },
    levels: [
      { title: 'Estagiário(a) Jurídico', salary: 2000 }, { title: 'Advogado(a) Jr', salary: 6000 },
      { title: 'Advogado(a) Sênior', salary: 13000 }, { title: 'Sócio(a)', salary: 30000 },
    ],
  },
  {
    id: 'financas', cleanRecord: true, name: 'Finanças', icon: '📈', hours: 45, stress: 1.5, req: { degree: 'negocios', inteligencia: 60 },
    levels: [
      { title: 'Trainee', salary: 4000 }, { title: 'Analista Financeiro', salary: 7500 },
      { title: 'Gerente de Investimentos', salary: 16000 }, { title: 'Diretor(a) Financeiro', salary: 32000 },
    ],
  },
  {
    id: 'design', name: 'Design', icon: '🎨', hours: 40, stress: 1.0, req: { degree: 'artes' },
    levels: [
      { title: 'Designer Jr', salary: 3000 }, { title: 'Designer', salary: 5500 },
      { title: 'Diretor(a) de Arte', salary: 11000 },
    ],
  },
  {
    id: 'professor', cleanRecord: true, name: 'Educação', icon: '📚', hours: 40, stress: 1.2, req: { degree: 'educacao' },
    levels: [
      { title: 'Professor(a) Substituto', salary: 2800 }, { title: 'Professor(a)', salary: 4500 },
      { title: 'Coordenador(a) Pedagógico', salary: 6500 }, { title: 'Diretor(a) de Escola', salary: 9000 },
    ],
  },
  {
    id: 'modelo', name: 'Moda', icon: '📸', hours: 30, stress: 1.3, req: { aparencia: 75, minAge: 16 },
    levels: [
      { title: 'Modelo Iniciante', salary: 2000 }, { title: 'Modelo', salary: 6000 },
      { title: 'Top Model', salary: 25000 },
    ],
  },
  {
    id: 'vendas', name: 'Vendas', icon: '🤝', hours: 44, stress: 1.2, req: { carisma: 55, minAge: 18 },
    levels: [
      { title: 'Vendedor(a)', salary: 2400 }, { title: 'Executivo(a) de Contas', salary: 5500 },
      { title: 'Gerente Comercial', salary: 11000 }, { title: 'Diretor(a) Comercial', salary: 22000 },
    ],
  },
];

type Lv = [string, number][];
const mk = (id: string, name: string, icon: string, hours: number, stress: number, req: CareerDef['req'], levels: Lv, extra: Partial<CareerDef> = {}): CareerDef => ({
  id, name, icon, hours, stress, req, levels: levels.map(([title, salary]) => ({ title, salary })), ...extra,
});

CAREERS.push(
  mk('cozinha', 'Gastronomia', '👨‍🍳', 44, 1.3, { minAge: 16 }, [['Ajudante de cozinha', 1700], ['Cozinheiro(a)', 2600], ['Sous-chef', 5200], ['Chef de cozinha', 9500], ['Chef estrelado(a)', 18000]]),
  mk('restaurante', 'Restaurantes', '🍽️', 40, 1.1, { minAge: 16 }, [['Garçom/Garçonete', 1500], ['Barista', 1900], ['Maître', 3500], ['Gerente de restaurante', 6500]]),
  mk('seguranca', 'Segurança', '🛡️', 44, 1.0, { minAge: 18, saude: 50 }, [['Vigilante', 2000], ['Supervisor(a) de segurança', 3500], ['Chefe de segurança', 6500]]),
  mk('motorista', 'Transporte por aplicativo', '🚕', 48, 1.1, { minAge: 18, license: 'carro' }, [['Motorista de app', 2200], ['Motorista executivo', 3600], ['Dono(a) de frota', 7000]]),
  mk('mecanico', 'Mecânica', '🔧', 44, 1.0, { minAge: 18 }, [['Ajudante de oficina', 1800], ['Mecânico(a)', 3200], ['Mecânico(a)-chefe', 5200], ['Dono(a) de oficina', 9000]]),
  mk('eletricista', 'Eletricidade', '💡', 44, 1.1, { minAge: 18 }, [['Ajudante de eletricista', 1800], ['Eletricista', 3400], ['Técnico(a) sênior', 5500]]),
  mk('policia', 'Polícia', '🚓', 44, 1.5, { edu: 'medio', minAge: 21, saude: 60 }, [['Soldado', 3000], ['Cabo', 4200], ['Sargento', 6000], ['Delegado(a)', 11000]], { cleanRecord: true }),
  mk('bombeiro', 'Bombeiros', '🚒', 48, 1.5, { edu: 'medio', minAge: 20, saude: 70 }, [['Bombeiro(a)', 3200], ['Cabo', 4500], ['Capitão(ã)', 8000]], { cleanRecord: true }),
  mk('militar', 'Forças Armadas', '🎖️', 48, 1.4, { minAge: 18, saude: 65 }, [['Soldado', 2400], ['Sargento', 4500], ['Tenente', 8000], ['Coronel', 15000], ['General', 30000]], { cleanRecord: true }),
  mk('piloto', 'Aviação comercial', '✈️', 40, 1.3, { edu: 'superior', minAge: 21, license: 'aviao' }, [['Copiloto', 9000], ['Comandante', 20000], ['Comandante sênior', 32000]]),
  mk('jornalismo', 'Jornalismo', '📰', 42, 1.3, { degree: 'jornalismo' }, [['Repórter', 3000], ['Editor(a)', 6500], ['Âncora', 15000], ['Diretor(a) de redação', 22000]]),
  mk('psicologia', 'Psicologia', '🧠', 36, 1.2, { degree: 'psicologia' }, [['Psicólogo(a)', 3500], ['Psicólogo(a) clínico(a)', 7500], ['Psicanalista renomado(a)', 14000]], { cleanRecord: true }),
  mk('odontologia', 'Odontologia', '🦷', 40, 1.1, { degree: 'odontologia' }, [['Dentista', 8000], ['Ortodontista', 14000], ['Dono(a) de clínica', 26000]], { cleanRecord: true }),
  mk('veterinaria', 'Veterinária', '🐾', 42, 1.2, { degree: 'veterinaria' }, [['Veterinário(a)', 5000], ['Veterinário(a) cirurgião(ã)', 9500], ['Dono(a) de clínica', 18000]]),
  mk('farmacia', 'Farmácia', '💊', 40, 1.0, { degree: 'farmacia' }, [['Farmacêutico(a)', 5500], ['Responsável técnico(a)', 9000], ['Gerente de laboratório', 15000]], { cleanRecord: true }),
  mk('engenharia', 'Engenharia', '🏗️', 44, 1.3, { degree: 'engenharia', inteligencia: 55 }, [['Engenheiro(a) Jr', 5500], ['Engenheiro(a) Pleno(a)', 9500], ['Engenheiro(a) Sênior', 16000], ['Diretor(a) de engenharia', 27000]]),
  mk('arquitetura', 'Arquitetura', '📐', 42, 1.1, { degree: 'arquitetura' }, [['Arquiteto(a) Jr', 4000], ['Arquiteto(a)', 7500], ['Sócio(a) de escritório', 15000]]),
  mk('ciencia', 'Pesquisa científica', '🔬', 40, 1.0, { degree: 'ciencias', inteligencia: 75 }, [['Pesquisador(a)', 4500], ['Cientista', 9000], ['Cientista-chefe', 17000]]),
  mk('contabilidade', 'Contabilidade', '🧮', 40, 1.0, { degree: 'contabilidade' }, [['Auxiliar contábil', 2800], ['Contador(a)', 5500], ['Controller', 11000], ['Diretor(a) financeiro(a)', 20000]]),
  mk('conteudo', 'Criação de conteúdo', '📹', 36, 1.2, { minAge: 14, carisma: 55 }, [['Criador(a) iniciante', 1200], ['Criador(a) de conteúdo', 4500], ['Influenciador(a)', 14000], ['Celebridade digital', 38000]]),
  mk('corretor', 'Mercado imobiliário', '🏘️', 44, 1.1, { edu: 'medio', minAge: 18, carisma: 50 }, [['Corretor(a)', 2400], ['Corretor(a) sênior', 5500], ['Dono(a) de imobiliária', 14000]]),
  mk('fitness', 'Fitness', '🏋️', 40, 0.9, { minAge: 18, saude: 70 }, [['Instrutor(a)', 2000], ['Personal trainer', 4500], ['Dono(a) de academia', 12000]]),
  mk('agro', 'Agropecuária', '🌾', 48, 1.1, { minAge: 18 }, [['Peão', 1700], ['Capataz', 3000], ['Produtor(a) rural', 8000], ['Grande produtor(a)', 20000]]),
  mk('docencia', 'Ensino superior', '🎓', 38, 1.1, { degree: 'educacao', inteligencia: 70 }, [['Professor(a) assistente', 5500], ['Professor(a) adjunto(a)', 9000], ['Catedrático(a)', 15000]], { cleanRecord: true }),
  mk('moda', 'Estilismo', '🧵', 40, 1.2, { degree: 'artes' }, [['Assistente de estilo', 2800], ['Estilista', 6500], ['Diretor(a) criativo(a)', 18000]]),
  mk('fotografia', 'Fotografia', '📷', 38, 1.0, { minAge: 16 }, [['Fotógrafo(a) iniciante', 2000], ['Fotógrafo(a) profissional', 6000], ['Fotógrafo(a) de moda', 12000]]),
);

export const careerById = (id: string) => CAREERS.find((c) => c.id === id)!;



export const COURSES: Record<CourseId, { name: string; icon: string; months: number; minInt: number }> = {
  tecnologia: { name: 'Ciência da Computação', icon: '💻', months: 48, minInt: 55 },
  saude: { name: 'Saúde', icon: '🩺', months: 60, minInt: 60 },
  negocios: { name: 'Administração', icon: '📊', months: 48, minInt: 45 },
  direito: { name: 'Direito', icon: '⚖️', months: 60, minInt: 55 },
  artes: { name: 'Artes & Design', icon: '🎨', months: 48, minInt: 35 },
  educacao: { name: 'Licenciatura', icon: '📚', months: 48, minInt: 40 },
  engenharia: { name: 'Engenharia', icon: '🏗️', months: 60, minInt: 60 },
  arquitetura: { name: 'Arquitetura', icon: '📐', months: 60, minInt: 55 },
  psicologia: { name: 'Psicologia', icon: '🧠', months: 60, minInt: 50 },
  odontologia: { name: 'Odontologia', icon: '🦷', months: 60, minInt: 60 },
  veterinaria: { name: 'Veterinária', icon: '🐾', months: 60, minInt: 55 },
  farmacia: { name: 'Farmácia', icon: '💊', months: 48, minInt: 50 },
  jornalismo: { name: 'Jornalismo', icon: '📰', months: 48, minInt: 40 },
  ciencias: { name: 'Ciências (Física e Química)', icon: '🔬', months: 48, minInt: 55 },
  contabilidade: { name: 'Ciências Contábeis', icon: '🧮', months: 48, minInt: 40 },
  gastronomia: { name: 'Gastronomia', icon: '👨‍🍳', months: 36, minInt: 30 },
};
