import type { Dispatch, SetStateAction } from "react";
import type { Person } from "./app-domain";

type Setter<T> = Dispatch<SetStateAction<T>>;
export type PersonForm = {
  name: string; likes: string; avoid: string; hidden: string; allergies: string;
  diet: string; needs: string; temporary: boolean;
};
type Context = {
  profiles: Person[]; weekPresence: boolean[][]; personForm: PersonForm;
  setProfiles: Setter<Person[]>; setWeekPresence: Setter<boolean[][]>; setPeople: Setter<number>;
  setPersonForm: Setter<PersonForm>; setModal: Setter<"scan" | "item" | "shopping" | "person" | null>;
  saveSetting: (key: string, value: unknown) => Promise<unknown>; flash: (message: string) => void;
};

export function createHouseholdActions(c: Context) {
  function applyProfiles(next: Person[], message?: string) {
    const nextPresence = Array.from({ length: 7 }, (_, day) => next.map((person) => {
      const previousIndex = c.profiles.findIndex((previous) => (person.id && previous.id === person.id) || previous.name === person.name);
      return previousIndex >= 0 ? c.weekPresence[day]?.[previousIndex] !== false : person.active;
    }));
    c.setProfiles(next); c.setWeekPresence(nextPresence);
    c.setPeople(Math.max(1, next.filter((person) => person.active).length));
    c.saveSetting("profiles", next); c.saveSetting("weekPresence", nextPresence);
    if (message) c.flash(message);
  }
  function updatePerson(index: number, patch: Partial<Person>) {
    const next = c.profiles.map((person, i) => i === index ? { ...person, ...patch } : person);
    c.setProfiles(next); c.saveSetting("profiles", next);
  }
  function addPerson() {
    if (!c.personForm.name.trim()) return;
    const person: Person = {
      id: `person-${Date.now()}`, name: c.personForm.name.trim(), likes: c.personForm.likes.trim(),
      avoid: c.personForm.avoid.trim(), hidden: c.personForm.hidden.trim(), allergies: c.personForm.allergies.trim(),
      diet: c.personForm.diet.trim(), needs: c.personForm.needs.trim(), temporary: c.personForm.temporary, active: true,
    };
    applyProfiles([...c.profiles, person], `${person.name} ajouté${person.temporary ? " temporairement" : ""}`);
    c.setPersonForm({ name: "", likes: "", avoid: "", hidden: "", allergies: "", diet: "", needs: "", temporary: true });
    c.setModal(null);
  }
  function togglePerson(index: number) {
    applyProfiles(c.profiles.map((person, i) => i === index ? { ...person, active: !person.active } : person));
  }
  function removePerson(index: number) {
    const removed = c.profiles[index];
    applyProfiles(c.profiles.filter((_, i) => i !== index), `${removed.name} retiré`);
  }
  return { applyProfiles, updatePerson, addPerson, togglePerson, removePerson };
}
