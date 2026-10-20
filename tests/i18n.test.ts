import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoCampaigns, eth } from '../src/lib/campaigns';
import { languageTag, localizedCampaign, translate } from '../src/lib/i18n';

test('Indonesian remains the default source and English translates interface copy', () => {
  assert.equal(translate('id', 'Jelajahi kampanye'), 'Jelajahi kampanye');
  assert.equal(translate('en', 'Jelajahi kampanye'), 'Explore campaigns');
  assert.equal(translate('en', 'User-written campaign'), 'User-written campaign');
  assert.equal(languageTag('id'), 'id-ID');
  assert.equal(languageTag('en'), 'en-US');
});

test('seed campaigns are localized without changing their category or original data', () => {
  const campaign = demoCampaigns()[0];
  const localized = localizedCampaign(campaign, 'en');
  assert.notEqual(localized.title, campaign.title);
  assert.notEqual(localized.description, campaign.description);
  assert.equal(localized.category, campaign.category);
  assert.equal(localizedCampaign(campaign, 'id'), campaign);
  assert.equal(localizedCampaign({ ...campaign, id: 'user-1' }, 'en').title, campaign.title);
});

test('ETH amounts follow the selected language', () => {
  assert.equal(eth('1234.5', 'id'), '1.234,5');
  assert.equal(eth('1234.5', 'en'), '1,234.5');
});
