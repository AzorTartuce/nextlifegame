import { registerAction } from '../systems/actions';
import { addPet } from '../systems/pets';
import { changeKarma } from '../systems/lifestate';

registerAction({
  id: 'act_pet_abrigo', group: 'pets', icon: '🏠', name: 'Adotar no abrigo', desc: 'Um bichinho que precisa de lar. De graça, e o karma agradece.',
  minAge: 14, risk: 'baixo', scene: 'natureza',
  choices: [
    { label: 'Um cachorro', text: 'Ele te olhou como se já te conhecesse. Foi amor à primeira vista.', effects: { stats: { felicidade: 6 }, karma: 3, run: (g) => { addPet(g, 'cachorro'); } } },
    { label: 'Um gato', text: 'Ele subiu no seu colo e dormiu. Decisão tomada.', effects: { stats: { felicidade: 6 }, karma: 3, run: (g) => { addPet(g, 'gato'); } } },
    { label: 'Um coelho', text: 'Pequeno, macio e muito curioso.', effects: { stats: { felicidade: 5 }, karma: 3, run: (g) => { addPet(g, 'coelho'); } } },
  ],
  en: {
    name: 'Adopt from a shelter', desc: 'A little one who needs a home. Free, and your karma says thanks.',
    choices: [{ label: 'A dog', text: 'He looked at you as if he already knew you. Love at first sight.' }, { label: 'A cat', text: 'She climbed into your lap and fell asleep. Decision made.' }, { label: 'A rabbit', text: 'Small, soft and very curious.' }],
  },
});

registerAction({
  id: 'act_pet_criador', group: 'pets', icon: '🐕‍🦺', name: 'Comprar de um criador', desc: 'Filhote de raça, com pedigree e preço.',
  minAge: 16, cost: 1200, risk: 'baixo', scene: 'natureza',
  choices: [
    { label: 'Cachorro de raça', text: 'Um filhote de pedigree que já se acha o dono da casa.', effects: { stats: { felicidade: 6 }, run: (g) => { addPet(g, 'cachorro'); } } },
    { label: 'Gato de raça', text: 'Elegante, exigente e imediatamente apaixonante.', effects: { stats: { felicidade: 6 }, run: (g) => { addPet(g, 'gato'); } } },
  ],
  en: { name: 'Buy from a breeder', desc: 'A pedigree puppy or kitten, with a price tag.', choices: [{ label: 'Purebred dog', text: 'A pedigree puppy who already thinks he owns the house.' }, { label: 'Purebred cat', text: 'Elegant, demanding and instantly lovable.' }] },
});

registerAction({
  id: 'act_pet_pequeno', group: 'pets', icon: '🐹', name: 'Pet de pequeno porte', desc: 'Hamster, passarinho ou aquário: baratos e fáceis de cuidar.',
  minAge: 10, cost: 80, risk: 'baixo', scene: 'natureza',
  choices: [
    { label: 'Hamster', text: 'Ele correu a noite inteira na rodinha. E você ouviu cada volta.', effects: { stats: { felicidade: 3 }, run: (g) => { addPet(g, 'hamster'); } } },
    { label: 'Passarinho', text: 'Canta todo dia às seis da manhã. Charmoso, mas cedo demais.', effects: { stats: { felicidade: 3 }, run: (g) => { addPet(g, 'passaro'); } } },
    { label: 'Aquário com peixes', text: 'Calmante, silencioso e hipnotizante.', effects: { stats: { felicidade: 3, estresse: -2 }, run: (g) => { addPet(g, 'peixe'); } } },
  ],
  en: { name: 'Small pet', desc: 'Hamster, bird or aquarium: cheap and easy to care for.', choices: [{ label: 'Hamster', text: 'He ran on the wheel all night. And you heard every lap.' }, { label: 'Bird', text: 'Sings every day at six a.m. Charming, but too early.' }, { label: 'Aquarium with fish', text: 'Calming, quiet and hypnotic.' }] },
});

registerAction({
  id: 'act_pet_exotico', group: 'pets', icon: '🐅', name: 'Animal exótico', desc: 'Cobra, macaco ou até um tigre. Caro, perigoso e inesquecível.',
  minAge: 21, cost: 6000, risk: 'alto', scene: 'perigo',
  choices: [
    { label: 'Cobra', text: 'Silenciosa e elegante. A vizinhança nunca mais te visitou.', effects: { stats: { felicidade: 3, carisma: -1 }, karma: -2, run: (g) => { addPet(g, 'cobra'); } } },
    { label: 'Macaco', text: 'Ele roubou seu celular no primeiro dia. Está feliz da vida.', effects: { stats: { felicidade: 5 }, karma: -2, run: (g) => { addPet(g, 'macaco'); } } },
    { label: 'Tigre', hint: '$1.500/mês', text: 'Você agora tem um tigre. A vizinhança mudou de bairro.', effects: { stats: { felicidade: 8, carisma: 2 }, karma: -5, run: (g) => { addPet(g, 'tigre'); changeKarma(g, 0); } } },
  ],
  en: { name: 'Exotic animal', desc: 'Snake, monkey or even a tiger. Expensive, dangerous and unforgettable.', choices: [{ label: 'Snake', text: 'Quiet and elegant. The neighbors never visited again.' }, { label: 'Monkey', text: 'He stole your phone on day one. Living his best life.' }, { label: 'Tiger', hint: '$1,500/month', text: 'You now own a tiger. The neighbors moved away.' }] },
});

