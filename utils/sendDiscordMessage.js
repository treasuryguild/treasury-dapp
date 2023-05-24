export async function sendDiscordMessage(myVariable) {
  // Define your data from the client-side
  const header = ''; //incoming or outgoing
  const wallet = myVariable.wallet
  const thash = '18b60f6223cae642cec1119953456cf40a9f3d4c9651fbca0d0e031a2a25c7c0' //myVariable.thash
  let website = myVariable.project_website?myVariable.project_website:''
  let txtype = 'Outgoing'//myVariable.txtype
  let txtype2 = ''
  if (txtype == 'Outgoing') {
    txtype2 = 'Amount paid'
  } else {
    txtype2 = 'Amount received'
  }
  let balTokens = myVariable
  console.log("balTokens",balTokens)
  const balance = '20 ADA'
  let txdetail = `* 20 ADA
* 30 DJED`
  let details = '```md\n' + `${txdetail}` + '\n```' + '\n`Wallet Balance of`\n'+'```css\n'+`${balance}`+'\n```';
  const content = `${header}`;
  const embeds = [
    {
      color: 0xff0000,
      title: 'Cardanoscan',
      url: `https://cardanoscan.io/transaction/${thash}`,
      author: {
        name: `${myVariable.project}`,
        url: `${website}`,
        icon_url: `${myVariable.logo_url}`,
      },
      description: `${txtype} transaction`,
      thumbnail: {
        url: 'https://github.com/treasuryguild/Treasury-Guild/raw/main/logo132.png',
      },
      fields: [
        {
          name: `${txtype2}`,
          value: `${details}`,
          inline: true,
        },
      ],
      image: {
        url: '',
      },
      footer: {
        text: 'Footer Text',
        icon_url: 'https://github.com/treasuryguild/Treasury-Guild/raw/main/logo132.png',
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