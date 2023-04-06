// components/ContributionForm.tsx

import React, { useState } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';

interface TokenAmount {
  token: string;
  amount: number;
}

interface Contributor {
  walletAddress: string;
  tokens: TokenAmount[];
}

interface FormValues {
  name: string;
  description: string;
  contributors: Contributor[];
}

const ContributionForm: React.FC = () => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      contributors: [],
    },
  });
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'contributors',
  });

  const [output, setOutput] = useState<string>('');

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    setOutput(JSON.stringify(values, null, 2));
  };

  return (
    <div>
      <h1>Contribution Form</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="name">Contribution Name:</label>
          <input {...register('name', { required: 'Required' })} type="text" />
          {errors.name && <div>{errors.name.message}</div>}
        </div>
        <div>
          <label htmlFor="description">Description:</label>
          <textarea {...register('description', { required: 'Required' })} />
          {errors.description && <div>{errors.description.message}</div>}
        </div>
        <h3>Contributors:</h3>
        {fields.map((field, index) => (
          <div key={field.id}>
            <div>
              <label htmlFor={`contributors.${index}.walletAddress`}>Wallet Address:</label>
              <input
                {...register(`contributors.${index}.walletAddress`, { required: 'Required' })}
                type="text"
                defaultValue={field.walletAddress}
              />
              {errors.contributors?.[index]?.walletAddress && (
                <div>{errors.contributors[index]?.walletAddress?.message}</div>
              )}
            </div>
            <h4>Tokens:</h4>
            {field.tokens.map((token, tokenIndex) => (
              <div key={`token-${tokenIndex}`}>
                <div>
                  <label htmlFor={`contributors.${index}.tokens.${tokenIndex}.token`}>Token:</label>
                  <input
                    {...register(`contributors.${index}.tokens.${tokenIndex}.token`, { required: 'Required' })}
                    type="text"
                    defaultValue={token.token}
                  />
                  {errors.contributors?.[index]?.tokens?.[tokenIndex]?.token && (
                    <div>{errors.contributors?.[index]?.tokens?.[tokenIndex]?.token?.message}</div>
                  )}
                </div>
                <div>
                  <label htmlFor={`contributors.${index}.tokens.${tokenIndex}.amount`}>Amount:</label>
                  <input
                    {...register(`contributors.${index}.tokens.${tokenIndex}.amount`, { required: 'Required' })}
                    type="number"
                    defaultValue={token.amount}
                  />
                  {errors.contributors?.[index]?.tokens?.[tokenIndex]?.amount && (
                    <div>{errors.contributors?.[index]?.tokens?.[tokenIndex]?.amount?.message}</div>
                  )}
                </div>
                <button
                  type="button"
                  data-token-index={tokenIndex}
                  onClick={(e) => {
                    const tokenIndexToRemove = parseInt(e.currentTarget.getAttribute('data-token-index') || '0');
                    const newTokens = field.tokens.filter((_, index) => index !== tokenIndexToRemove);
                    update(index, { walletAddress: field.walletAddress, tokens: newTokens });
                  }}
                >
                  Remove Token
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newTokens = [...field.tokens, { token: '', amount: 0 }];
                update(index, { walletAddress: field.walletAddress, tokens: newTokens });
              }}
            >
              Add Token
            </button>
            <button type="button" onClick={() => remove(index)}>
              Remove Contributor
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            append({
              walletAddress: '',
              tokens: [{ token: '', amount: 0 }],
            })
          }
        >
          Add Contributor
        </button>
        <div>
          <button type="submit">Submit</button>
        </div>
      </form>
      <h2>Output:</h2>
      <pre>{output}</pre>
    </div>
  );
};

export default ContributionForm;
