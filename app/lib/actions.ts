'use server'

import { z } from "zod";
import { createDatabase } from "../seed/route";
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const client = await createDatabase();

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export const createInvoice = async (formData: FormData) => {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  const query = `INSERT INTO invoices (customer_id, amount, status, date) VALUES ($1, $2, $3, $4)`;
  
  client.query(query, [customerId, amountInCents, status, date]);

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
};