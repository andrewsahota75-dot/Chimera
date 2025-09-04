
import React from 'react';
import { useBotStore } from '../store/botStore';

export const ControlPanel: React.FC = () => {
  const { bots, selectedBot, actions } = useBotStore();
  const [isLoading, setIsLoading] = React.useState<string | null>(null);

  const handleCommand = async (command: 'start' | 'stop') => {
    if (selectedBot === 'all') {
      alert('Please select a specific bot to control.');
      return;
    }
    setIsLoading(command);
    try {
      // In a real app, the API host would be configured
      await fetch(`http://localhost:3000/api/bots/${selectedBot}/${command}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error(`Failed to send ${command} command to ${selectedBot}`, error);
      alert(`Error sending ${command} command. Check console for details.`);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-md font-semibold">Control Panel</h3>
      <div>
        <label htmlFor="bot-selector" className="text-xs text-chimera-lightgrey">
          Active Bot
        </label>
        <select
          id="bot-selector"
          value={selectedBot}
          onChange={(e) => actions.selectBot(e.target.value)}
          className="w-full bg-chimera-grey p-2 rounded-md border border-transparent focus:border-chimera-blue focus:outline-none"
        >
          <option value="all">All Bots</option>
          {bots.map((bot) => (
            <option key={bot} value={bot}>
              {bot}
            </option>
          ))}
        </select>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => handleCommand('start')}
          disabled={selectedBot === 'all' || isLoading === 'start'}
          className="flex-1 py-2 font-bold rounded-md bg-chimera-green text-white hover:bg-chimera-green/90 disabled:bg-chimera-grey disabled:cursor-not-allowed"
        >
          {isLoading === 'start' ? 'Starting...' : 'Start'}
        </button>
        <button
          onClick={() => handleCommand('stop')}
          disabled={selectedBot === 'all' || isLoading === 'stop'}
          className="flex-1 py-2 font-bold rounded-md bg-chimera-red text-white hover:bg-chimera-red/90 disabled:bg-chimera-grey disabled:cursor-not-allowed"
        >
          {isLoading === 'stop' ? 'Stopping...' : 'Stop'}
        </button>
      </div>
    </div>
  );
};
