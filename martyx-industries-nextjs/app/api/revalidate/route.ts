import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

interface RevalidateRequestBody {
  paths?: string[];
  tags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '');

    if (!token || token !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    // Parse request body
    let body: RevalidateRequestBody;
    try {
      body = await request.json();
    } catch (_error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON body'
        },
        { status: 400 }
      );
    }

    const { paths, tags } = body;

    // Validate that at least one of paths or tags is provided
    if ((!paths || paths.length === 0) && (!tags || tags.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either paths or tags must be provided'
        },
        { status: 400 }
      );
    }

    const results: Array<{ type: 'path' | 'tag'; value: string; success: boolean; error?: string }> = [];

    // Revalidate paths
    if (paths && paths.length > 0) {
      for (const path of paths) {
        try {
          // Validate path format
          if (!path.startsWith('/')) {
            results.push({
              type: 'path',
              value: path,
              success: false,
              error: 'Path must start with /'
            });
            continue;
          }

          revalidatePath(path);
          results.push({
            type: 'path',
            value: path,
            success: true
          });
        } catch (_error) {
          results.push({
            type: 'path',
            value: path,
            success: false,
            error: _error instanceof Error ? _error.message : 'Unknown error'
          });
        }
      }
    }

    // Revalidate tags
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        try {
          revalidateTag(tag);
          results.push({
            type: 'tag',
            value: tag,
            success: true
          });
        } catch (_error) {
          results.push({
            type: 'tag',
            value: tag,
            success: false,
            error: _error instanceof Error ? _error.message : 'Unknown error'
          });
        }
      }
    }

    // Check if all operations were successful
    const allSuccessful = results.every(result => result.success);
    const failedOperations = results.filter(result => !result.success);

    // Log revalidation results
    console.log('[Revalidate API]', {
      success: allSuccessful,
      pathsCount: paths?.length || 0,
      tagsCount: tags?.length || 0,
      failedCount: failedOperations.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: allSuccessful,
      message: allSuccessful
        ? 'All revalidation operations completed successfully'
        : `${failedOperations.length} operation(s) failed`,
      results,
      timestamp: new Date().toISOString()
    }, {
      status: allSuccessful ? 200 : 207 // 207 Multi-Status for partial success
    });

  } catch (error) {
    console.error('Revalidation API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST with Authorization header.'
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST with Authorization header.'
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST with Authorization header.'
    },
    { status: 405 }
  );
}