export interface Deck {
  id: string;
  label: string;
}

// Only one deck exists today. The splash screen's deck dropdown already
// renders from this list, so adding a second deck later (e.g. a different
// artist's song collection) is just adding another entry here — no
// component changes needed, only wiring up the deck's own song data.
export const DECKS: Deck[] = [{ id: "jazz-timeline", label: "All the good stuff" }];
