This directory contains the clusterIndices of the cluster results.

This is done because the files can get very large, therefore the clusterIndices arrays are too big to be cached without running into memory issues.

The filename is constructed as follows:
{filename}_clusterIndices_k={k}_selectedAttributeIndices={selectedAttributeIndices}_maxIterations=${maxIterations}_batchSize=${batchSize}.csv