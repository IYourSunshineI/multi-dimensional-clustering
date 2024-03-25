# multi-dimensional-clustering

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/IYourSunshineI/multi-dimensional-clustering.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Run the project
   ```sh
   npm run dev
   ```

### Usage

#### Adding your dataset
1. Upload the file you want to cluster to ```/public/datasets/```
2. Refresh the browser and your file should be ready in the dropdown

#### Inputs
- **Dataset**: The dataset you want to cluster
- **#Clusters**: The number of clusters you want to create
- **#Iterations**: The maximum number of iterations you want the algorithm to perform
- **Batch Size**: The number of data points to process in each iteration (if set to 0, all datapoints are beeing processed)
- **Time Span**: How the datapoints should be grouped for the timeline (either per day or per hour)

#### Clustering
- Select the dataset you want to cluster
- Provide your values for the inputs (**#Clusters** and **Time Span** can be changed after clustering)
- Choose the attributes you want to cluster on, by pressing the ```start``` button and checking the corresponding checkbox in the popup 
- Press the ```start``` button in the popup to start the clustering process
- Depending on the size of the dataset, the clustering process can take a while
- After the process has finished you can adjust the **#Clusters** based on the Elbow-Plot (the results are rendered again based on the change)
- Your can also change the **Time Span** for further analysis

#### Caching
The results are "cached" as files in the ```/public/results/``` folder. With that the calculations are only beeing done once for one dataset with the same settings.
If you wish to recalculate the results, you can press the ```delete-history``` button and the created files will be deleted.


### About
![image](https://github.com/IYourSunshineI/multi-dimensional-clustering/blob/main/img/Screenshot.png)
