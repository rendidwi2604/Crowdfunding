import { BrowserProvider, Contract, type Eip1193Provider } from 'ethers';
export const SEPOLIA_ID = 11155111;
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
export const ABI = [
  'function createCampaign(uint256 target, uint256 deadline) returns (uint256)',
  'function donateToCampaign(uint256 campaignId) payable',
  'function withdrawFunds(uint256 campaignId)',
  'function getCampaignDetails(uint256 campaignId) view returns (address creator, uint256 target, uint256 deadline, uint256 raised, bool withdrawn)',
  'event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 target, uint256 deadline)',
  'event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount, uint256 timestamp)',
  'event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount)',
];
export interface WalletProvider extends Eip1193Provider { on?: (event: string, handler: (...args: unknown[]) => void) => void; removeListener?: (event: string, handler: (...args: unknown[]) => void) => void; }
declare global { interface Window { ethereum?: WalletProvider } }
export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask belum ditemukan. Instal ekstensi MetaMask atau buka melalui browser MetaMask.');
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const chain = await window.ethereum.request({ method: 'eth_chainId' });
  if (chain !== '0xaa36a7') await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] });
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}
export async function writeContract(expectedAddress: string) {
  if (!CONTRACT_ADDRESS) throw new Error('Kontrak Sepolia belum dikonfigurasi. Silakan gunakan mode demo.');
  const connection = await connectWallet();
  if (connection.address.toLowerCase() !== expectedAddress.toLowerCase()) throw new Error('Akun MetaMask berubah. Hubungkan ulang dompet Anda.');
  return { ...connection, contract: new Contract(CONTRACT_ADDRESS, ABI, connection.signer) };
}
export const friendlyError = (error: unknown): string => {
  const e = error as { code?: string | number; shortMessage?: string; message?: string };
  if (e.code === 'ACTION_REJECTED' || e.code === 4001) return 'Permintaan dibatalkan di dompet. Anda dapat mencoba lagi.';
  if (e.code === 'INSUFFICIENT_FUNDS') return 'Saldo Sepolia ETH belum cukup untuk jumlah donasi dan gas.';
  return e.shortMessage || e.message || 'Terjadi kesalahan. Silakan coba lagi.';
};
