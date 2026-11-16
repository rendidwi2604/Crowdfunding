import { isAddress, type Eip1193Provider } from 'ethers';

// Request account selection only after an explicit Connect / Switch account click.
export async function walletAccount(provider: Eip1193Provider, selectAccount = false): Promise<string> {
  if (selectAccount) {
    await provider.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
  }
  const accounts: unknown = await provider.request({ method: 'eth_accounts' });
  if (!Array.isArray(accounts) || typeof accounts[0] !== 'string' || !isAddress(accounts[0])) {
    throw new Error('Belum ada akun wallet yang terhubung. Klik Hubungkan MetaMask lalu pilih akun yang ingin digunakan.');
  }
  return accounts[0];
}
