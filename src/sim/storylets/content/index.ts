import { registerStorylets } from '../engine';
import { ADULTO } from './adulto';
import { CRIME } from './crime';
import { EXTRA1 } from './extra1';
import { EXTRA2 } from './extra2';
import { EXTRA3 } from './extra3';
import { EXTRA4 } from './extra4';
import { INFANCIA } from './infancia';
import { POLITICA } from './politica';
import { SAUDE } from './saude';
import { TRABALHO } from './trabalho';

registerStorylets([...INFANCIA, ...ADULTO, ...TRABALHO, ...SAUDE, ...CRIME, ...POLITICA, ...EXTRA1, ...EXTRA2, ...EXTRA3, ...EXTRA4]);
