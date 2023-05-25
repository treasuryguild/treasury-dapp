export async function sendDiscordMessage(myVariable, txdata) {
  // Define your data from the client-side
  const header = ''; //incoming or outgoing
  const wallet = myVariable.wallet
  const thash = txdata.thash
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
  console.log("balTokens",balTokens)
  const balance = `${txdata.balanceString}`
  let txdetail = `${txdata.totalAmountsString}`
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
      description: `[Dashboard](https://treasuryguild.com/${encodeURIComponent(myVariable.group)}/${encodeURIComponent(myVariable.project)})`+'   '+`[TxView](https://treasuryguild.com/transactions/${thash})`,//'`'+`${txtype}`+' transaction'+'`'+'\n'+'```'+`${txdata.txdescription}`+'```',
      thumbnail: {
        url: '',
      },
      fields: [
        {
          name: '```'+`${txdata.txdescription}`+'```',
          value: `${details}`,
          inline: true,
        },
      ],
      image: {
        url: '',
      },
      footer: {
        text: `Exchange Rate - ${txdata.tokenRates.ADA} USD per ADA - ${txdata.formattedDate}`
        //icon_url: 'https://github.com/treasuryguild/Treasury-Guild/raw/main/logo132.png',
      },
    },
  ];

  try {
    const response = await fetch('/api/discord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send the data to the API route
      body: JSON.stringify({ content, embeds, wallet }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}