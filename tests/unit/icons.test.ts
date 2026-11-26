import { describe, expect, it } from 'vitest';
import { ITEMS } from '../../src/data/items';
import { RECIPES } from '../../src/data/recipes';
import { gameIcon, hasIcon } from '../../src/ui/Icons';
describe('catálogo de ícones',()=>{
  it('cobre todos os itens e estruturas',()=>{
    for(const id of Object.keys(ITEMS)) expect(hasIcon(id)).toBe(true);
    for(const r of RECIPES) if(r.placesStructure) expect(hasIcon(r.placesStructure)).toBe(true);
  });
  it('ilustra cada item e construção com cores locais e distingue variantes',()=>{
    for(const id of Object.keys(ITEMS)) expect(gameIcon(id,'item')).toContain('icon-illustrated');
    for(const r of RECIPES) if(r.placesStructure) expect(gameIcon(r.placesStructure,'item')).toContain('icon-illustrated');
    expect(gameIcon('agua_pura')).not.toBe(gameIcon('agua_salgada'));
    expect(gameIcon('escada')).not.toBe(gameIcon('escada_interna'));
    expect(gameIcon('peixe_cru')).not.toBe(gameIcon('peixe_assado'));
    expect(gameIcon('saude')).toContain('icon-interface');
  });
  it('gera ícones locais e evita interpolar identificadores desconhecidos',()=>{
    expect(gameIcon('gancho','item')).toContain('viewBox="0 0 24 24"');
    expect(gameIcon('"><script>')).toBe(gameIcon('empty'));
    expect(gameIcon('gancho','item')).toBe(gameIcon('gancho','item'));
  });
});