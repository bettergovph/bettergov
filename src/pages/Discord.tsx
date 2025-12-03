import { useEffect } from 'react';

export default function Discord() {
  useEffect(function () {
    window.location.assign('https://discord.gg/bettergovph');
  }, []);
  return <h1>Redirecting to BetterGov.ph Discord Invite Link...</h1>;
}
