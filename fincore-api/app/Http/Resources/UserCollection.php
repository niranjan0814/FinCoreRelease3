<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'pagination' => [
                'total' => $this->total(),
                'per_page' => $this->perPage(),
                'current_page' => $this->currentPage(),
                'last_page' => $this->lastPage(),
                'from' => $this->firstItem(),
                'to' => $this->lastItem(),
                'links' => $this->linkCollection()->toArray(),
            ],
        ];
    }

    /**
     * Customize the response for a request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Http\JsonResponse  $response
     * @return void
     */
    public function withResponse($request, $response)
    {
        $data = $response->getData(true);
        
        // Reformat response structure
        $formattedData = [
            'success' => true,
            'message' => 'Users retrieved successfully',
            'data' => [
                'items' => $data['data'] ?? [],
                'pagination' => $data['pagination'] ?? [],
            ]
        ];
        
        $response->setData($formattedData);
    }
}