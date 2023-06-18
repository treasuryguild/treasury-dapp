//https://lambent-kelpie-e8b15c.netlify.app/api/discord
import axios from 'axios';

export async function sendDiscordMessage(myVariable) {
  // Define your data from the client-side
  const header = ''; //incoming or outgoing
  const wallet = myVariable.wallet
  let website = myVariable.project_website?myVariable.project_website:''
  let txtype = myVariable.txtype
  let txtype2 = ''
  let color = 0xeb3477
  if (txtype == 'Outgoing') {
    txtype2 = 'Amount paid'
    color = 0xeb3477
  } else {
    txtype2 = 'Amount received'
    color = 0x16fa3c
  }
  let balTokens = myVariable
  const thash = balTokens.txHash
  console.log("balTokens",balTokens, myVariable)
  const balance = `${myVariable.balanceString}`
  let txdetail = `${myVariable.totalAmountsString}`
  let details = '```md\n' + `${txdetail}` + '\n```' + '\n`Wallet Balance of `'+`[${myVariable.project}](https://pool.pm/${myVariable.wallet})`+'\n'+'```css\n'+`${balance}`+'\n```';
  const content = `${header}`;
  const embeds = [
    {
      color: color,
      title: 'Cardanoscan',
      url: `https://cardanoscan.io/transaction/${thash}`,
      author: {
        name: `${myVariable.project}`,
        url: `${website}`,
        icon_url: `${myVariable.logo_url}`,
      },
      description: `[Dashboard](https://treasuryguild.com/${encodeURIComponent(myVariable.group)}/${encodeURIComponent(myVariable.project)})`+'   '+`[TxView](https://treasuryguild.com/transactions/${thash})`,//'`'+`${txtype}`+' transaction'+'`'+'\n'+'```'+`${myVariable.txdescription}`+'```',
      thumbnail: {
        url: '',
      },
      fields: [
        {
          name: '```'+`${myVariable.txdescription}`+'```',
          value: `${details}`,
          inline: true,
        },
      ],
      image: {
        url: '',
      },
      footer: {
        text: `Exchange Rate - ${myVariable.tokenRates.ADA} USD per ADA - ${myVariable.formattedDate}`
        //icon_url: 'https://github.com/treasuryguild/Treasury-Guild/raw/main/logo132.png',
      },
    },
  ];

  try {
    const response = await axios.post('https://lambent-kelpie-e8b15c.netlify.app/api/discord', { content, embeds, wallet }, { 
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status !== 200) {
      throw new Error('Failed to send message');
    }

    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}
