import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { handler as nextAuthHandler } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/expenses - Get all expenses for the current user
export async function GET(request) {
  try {
    // For Next.js App Router, we can use getServerSession without authOptions
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // TEMPORARY: For testing purposes - get the first user
    // In production, you should use proper authentication
    let userId = session.user?.id;
    
    if (!userId) {
      // Fallback to first user for development
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return NextResponse.json({ error: 'No users found in database' }, { status: 404 });
      }
      userId = firstUser.id;
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    const query = {
      where: {
        userId: userId, // Use direct userId field
      },
      orderBy: {
        date: 'desc',
      },
    };
    
    // Filter by expense type if provided
    if (type) {
      query.where.type = type;
    }
    
    const expenses = await prisma.expense.findMany(query);
    
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses: ' + error.message }, { status: 500 });
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user's ID and account tier from the session
    let userId = session.user?.id;
    const accountTier = session.user?.accountTier || 'FREE';
    
    if (!userId) {
      // Fallback to first user for development
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return NextResponse.json({ error: 'No users found in database' }, { status: 404 });
      }
      userId = firstUser.id;
    }
    
    const data = await request.json();
    
    // Check if the user has reached their limit for this expense type
    if (accountTier === 'FREE') {
      const expenseCount = await prisma.expense.count({
        where: {
          userId: userId,
          type: data.type
        }
      });
      
      // Free accounts are limited to 12 expenses per type
      if (expenseCount >= 12) {
        return NextResponse.json(
          { error: 'Has alcanzado el límite de gastos para este tipo en tu plan actual. Actualiza a Premium o Elite para registrar gastos ilimitados.' }, 
          { status: 403 }
        );
      }
    }
    
    const expense = await prisma.expense.create({
      data: {
        amount: data.amount,
        description: data.description,
        type: data.type,
        date: data.date ? new Date(data.date) : new Date(),
        userId: userId, // Use direct userId field
      },
    });
    
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense: ' + error.message }, { status: 500 });
  }
}
