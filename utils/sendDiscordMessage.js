//https://lambent-kelpie-e8b15c.netlify.app/api/discord
import axios from 'axios';

export async function sendDiscordMessage(myVariable) {
  const header = '';
  let wallet = myVariable.wallet
  let website = myVariable.project_website ? (myVariable.project_website.startsWith('http://') || myVariable.project_website.startsWith('https://') ? myVariable.project_website : `http://${myVariable.project_website}`) : ''
  let txtype = myVariable.txtype
  let txtype2 = ''
  let color = 0xeb3477
  if (txtype === 'Incoming') {
    txtype2 = 'Amount received'
    wallet = myVariable.incomingwallet
    color = 0x16fa3c
  } else if (txtype === 'Outgoing') {
    txtype2 = 'Amount paid'
    color = 0xeb3477
  } else {
    txtype2 = 'Amount received'
    color = 0x16fa3c
  }
  let balTokens = myVariable
  const thash = balTokens.txHash
  console.log("balTokens", balTokens, myVariable)
  const balance = `${myVariable.balanceString}`
  let txdetail = `${myVariable.totalAmountsString}`
  let details = ''
  if (myVariable.project === "Singularity Net Ambassador Wallet" || myVariable.project === "Test Wallet") {
    details = '```md\n' + `${txdetail}` + '\n```' + '\n`Wallet Balance of `'+`[${myVariable.project}](https://pool.pm/${wallet})`+'\n'+'```css\n'+`${balance}`+'\n```'+'\n'+`Monthly Budget Balance `+'```md\n' + `${myVariable.monthly_wallet_budget_string}` + '\n```'
  } else {
    details = '```md\n' + `${txdetail}` + '\n```' + '\n`Wallet Balance of `'+`[${myVariable.project}](https://pool.pm/${wallet})`+'\n'+'```css\n'+`${balance}`+'\n```';
  }
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
      description: `[Dashboard](https://treasuryguild.com/${encodeURIComponent(myVariable.group)}/${encodeURIComponent(myVariable.project)})`+'   '+`[TxView](https://treasuryguild.com/transactions/${thash})`,
      fields: [
        {
          name: `${myVariable.txdescription}`,
          value: `${details}`,
          inline: true,
        },
      ],
      footer: {
        text: `Exchange Rate - ${myVariable.tokenRates.ADA} USD per ADA - ${myVariable.formattedDate}`
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

  console.log("SendDiscord", "Content", content, "Embeds", embeds, wallet)
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
