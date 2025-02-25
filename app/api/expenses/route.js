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
    
    const data = await request.json();
    
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
