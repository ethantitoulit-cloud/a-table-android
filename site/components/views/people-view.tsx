"use client";

import { Check, ChevronRight, Plus, Trash2 } from "lucide-react";
import { PageTitle } from "../recipe-tile";

export type PersonProfile = { id?: string; name: string; likes: string; avoid: string; hidden: string; allergies: string; diet: string; needs: string; temporary: boolean; active: boolean };

export function PeopleView({ profiles, add, update, toggle, remove, save }: {
  profiles: PersonProfile[];
  add: () => void;
  update: (index: number, patch: Partial<PersonProfile>) => void;
  toggle: (index: number) => void;
  remove: (index: number) => void;
  save: () => void;
}) {
  return <section className="content">
    <PageTitle eyebrow="DES MENUS QUI NOUS RESSEMBLENT" title="Personnes et préférences" action={<button className="primary" onClick={add}><Plus size={17} /> Ajouter une personne</button>} />
    <div className="profile-grid">{profiles.map((person, index) => <details className={`profile ${person.active ? "" : "inactive"}`} key={person.id || index}>
      <summary className="profile-head"><div className="avatar">{person.name[0]}</div><span className="profile-summary"><b>{person.name}</b><small>{person.active ? "Présente pour les menus" : "Absente des menus"}{person.avoid ? ` · N’aime pas : ${person.avoid}` : ""}</small></span><span className={person.temporary ? "person-badge temporary" : "person-badge"}>{person.temporary ? "Temporaire" : "Habituelle"}</span><ChevronRight className="profile-chevron" /></summary>
      <div className="profile-fields">
        <input className="person-name" value={person.name} onChange={(event) => update(index, { name: event.target.value })} />
        <label className="presence-toggle"><input type="checkbox" checked={person.active} onChange={() => toggle(index)} />Présente pour les menus</label>
        <label>Aime<textarea value={person.likes} onChange={(event) => update(index, { likes: event.target.value })} placeholder="Ex. poulet rôti, plats créoles" /></label>
        <label>N’aime pas<textarea value={person.avoid} onChange={(event) => update(index, { avoid: event.target.value })} placeholder="Ex. champignons, poisson" /></label>
        <label>Possible si c’est discret ou mixé<textarea value={person.hidden} onChange={(event) => update(index, { hidden: event.target.value })} placeholder="Ex. lentilles, courgettes" /></label>
        <label>Allergies — exclusion stricte<textarea value={person.allergies} onChange={(event) => update(index, { allergies: event.target.value })} placeholder="Ex. arachides, crustacés" /></label>
        <label>Régime alimentaire<textarea value={person.diet} onChange={(event) => update(index, { diet: event.target.value })} placeholder="Ex. végétarien, sans porc, sans lactose" /></label>
        <label>Besoins particuliers<textarea value={person.needs} onChange={(event) => update(index, { needs: event.target.value })} placeholder="Ex. repas léger, sans gluten" /></label>
        <button className="remove-person" onClick={() => remove(index)}><Trash2 size={15} /> Retirer cette personne</button>
      </div>
    </details>)}</div>
    <button className="primary profile-save" onClick={save}><Check size={17} /> Enregistrer nos goûts</button>
  </section>;
}
