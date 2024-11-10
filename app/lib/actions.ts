'use server'

import { z } from "zod";
import { createDatabase } from "../seed/route";
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


const client = await createDatabase();

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
 
export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    const query = `INSERT INTO invoices (customer_id, amount, status, date) VALUES ($1, $2, $3, $4)`;
  
    client.query(query, [customerId, amountInCents, status, date]);
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
};

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;

  try {
    await client.query(`UPDATE invoices SET customer_id =$1, amount=$2, status=$3 WHERE id=$4`, [customerId, amount, status, id]);
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice.',
    };
  }  
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');
  try {
    await client.query(`DELETE FROM invoices WHERE id = $1`, [id]);
  } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Invoice.',
    };
  }
  
  revalidatePath('/dashboard/invoices');
}
