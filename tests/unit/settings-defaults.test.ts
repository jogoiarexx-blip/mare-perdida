import {describe,it,expect} from 'vitest';
import {DEFAULT_OPTIONS,SaveStore} from '../../src/save/Store';
describe('opções compartilhadas',()=>{
 it('mantém perfil gráfico completo por padrão e canais separados',()=>{
  expect(DEFAULT_OPTIONS.quality).toBe('alto');expect(DEFAULT_OPTIONS.shadows).toBe(true);
  expect(DEFAULT_OPTIONS.effectsVolume).toBe(1);expect(DEFAULT_OPTIONS.ambienceVolume).toBe(1);
  expect(new SaveStore().loadOptions()).toMatchObject(DEFAULT_OPTIONS);
 });
});