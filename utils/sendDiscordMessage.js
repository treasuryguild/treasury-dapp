// ../utils/sendDiscordMessage.js
import axios from 'axios';

export async function sendDiscordMessage(myVariable) {
  const header = '';
  let wallet = myVariable.wallet
  let website = myVariable.project_website ? (myVariable.project_website.startsWith('http://') || myVariable.project_website.startsWith('https://') ? myVariable.project_website : `http://${myVariable.project_website}`) : ''
  let txtype = myVariable.txtype
  let txtype2 = ''
  let color = 0xeb3477
  let tokenRate = ''
  if (txtype === 'Incoming') {
    txtype2 = 'Amount received';
    if (myVariable.incomingwallet) {
      wallet = myVariable.incomingwallet;
    } else {
      console.warn('Warning: Incoming transaction detected but incomingwallet is missing. Using default wallet.');
    }
    color = 0x16fa3c;
  } else if (txtype === 'Outgoing') {
    txtype2 = 'Amount paid'
    color = 0xeb3477
  } else {
    txtype2 = 'Amount received'
    color = 0x16fa3c
  }
  let balTokens = myVariable
  const thash = balTokens.txHash
  //console.log("balTokens", balTokens, myVariable)
  let details = ''
  
  const { extra_fields, footer } = myVariable.discord_msg;
  
  // Determine token rate formatter based on the footer value
  const tokenRateFormatter = (tokenRates, formattedDate) => {
    switch (footer) {
      case 'AGIX':
        return `Exchange Rate - ${tokenRates.AGIX} USD per AGIX - ${formattedDate}`;
      case 'dateOnly':
        return `${formattedDate}`;
      case 'default':
      default:
        return `Exchange Rate - ${tokenRates.ADA} USD per ADA - ${formattedDate}`;
    }
  };
  
  // Determine details formatter based on the extra_fields value
  const detailsFormatter = (myVariable) => {
    let detailsBase = '```css\n' + `${myVariable.totalAmountsString}` + '\n```' + '\n' + `**[Wallet Balance](https://pool.pm/${wallet})**` + '\n' + '```css\n' + `${myVariable.balanceString}` + '\n```';
    if (extra_fields === 'quarterlyBudgets') {
      detailsBase += '\n' + `**Quarterly Budget Balance** ` + '```css\n' + `${myVariable.monthly_wallet_budget_string}` + '\n```';
    }
    return detailsBase;
  };
  
  tokenRate = tokenRateFormatter(myVariable.tokenRates, myVariable.formattedDate);
  details = detailsFormatter(myVariable);

  const content = `${header}`;
  const embeds = [
    {
      color: color,
      title: 'Cardanoscan',
      url: `https://cardanoscan.io/transaction/${thash}`,
      author: {
        name: `${myVariable.project}`,
        url: `${website}`,
        icon_url: `${myVariable.logo_url ? myVariable.logo_url : ''}`,
      },
      description: `[Dashboard](https://treasuryguild.com/${encodeURIComponent(myVariable.group)}/${encodeURIComponent(myVariable.project)})`+'   '+`[TxView](https://treasuryguild.com/${encodeURIComponent(myVariable.group)}/${encodeURIComponent(myVariable.project)}/${thash})`,
      fields: [
        {
          name: `${myVariable.txdescription}`,
          value: `${details}`,
          inline: true,
        },
      ],
      footer: {
        text: tokenRate
        //icon_url: 'https://github.com/treasuryguild/Treasury-Guild/raw/main/logo132.png',
      },
    },
  ];

  if(myVariable.thumbnail_url) {
    embeds[0].thumbnail = { url: myVariable.thumbnail_url };
  }

  if(myVariable.image_url) {
    embeds[0].image = { url: myVariable.image_url };
  }

  //console.log("SendDiscord", "Content", content, "Embeds", embeds, wallet)
  try {
    const response = await axios.post('https://lambent-kelpie-e8b15c.netlify.app/api/discord', { content, embeds, wallet }, { 
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error('Failed to send message');
    }    
  } catch (error) {
    console.error(error);
    if (error.response) {
      console.error(error.response.data);
    }
  }
}
