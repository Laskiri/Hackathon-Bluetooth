import React, { createContext, useContext, useState } from 'react';

type Team = any;

type TeamContextShape = {
  team: Team | null;
  setTeam: (t: Team | null) => void;
};

const TeamContext = createContext<TeamContextShape>({ team: null, setTeam: () => {} });

export const TeamProvider = ({ children }: { children: React.ReactNode }) => {
  const [team, setTeam] = useState<Team | null>(null);
  return <TeamContext.Provider value={{ team, setTeam }}>{children}</TeamContext.Provider>;
};

export const useTeam = () => useContext(TeamContext);

export default TeamContext;
